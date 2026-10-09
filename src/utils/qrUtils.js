import jsQR from 'jsqr'
import QRCode from 'qrcode'

export const normalizeQrImage = (value) => {
  if (!value) {
    return ''
  }

  if (
    value.startsWith(
      'data:image',
    )
  ) {
    return value
  }

  return (
    'data:image/png;base64,' +
    value
  )
}

const loadImage = (source) => {
  return new Promise(
    (resolve, reject) => {
      const image =
        new Image()

      image.onload = () => {
        resolve(image)
      }

      image.onerror = () => {
        reject(
          new Error(
            'No fue posible cargar la imagen del código QR.',
          ),
        )
      }

      image.src = source
    },
  )
}

const tryDecode =
  (
    pixelData,
    width,
    height,
  ) => {
    return jsQR(
      pixelData,
      width,
      height,
      {
        inversionAttempts:
          'attemptBoth',
      },
    )
  }

const createThresholdPixels =
  (
    originalPixels,
    threshold,
  ) => {
    const pixels =
      new Uint8ClampedArray(
        originalPixels,
      )

    for (
      let i = 0;
      i < pixels.length;
      i += 4
    ) {
      const red =
        pixels[i]

      const green =
        pixels[i + 1]

      const blue =
        pixels[i + 2]

      const brightness =
        (
          red * 0.299 +
          green * 0.587 +
          blue * 0.114
        )

      const value =
        brightness <
        threshold
          ? 0
          : 255

      pixels[i] = value
      pixels[i + 1] = value
      pixels[i + 2] = value
      pixels[i + 3] = 255
    }

    return pixels
  }

// El QR con degradado y logo puede requerir umbrales de contraste para decodificarse.
export const decodeQrImage =
  async (imageSource) => {
    const image =
      await loadImage(
        imageSource,
      )

    const width =
      image.naturalWidth ||
      image.width

    const height =
      image.naturalHeight ||
      image.height

    const canvas =
      document.createElement(
        'canvas',
      )

    canvas.width = width
    canvas.height = height

    const context =
      canvas.getContext(
        '2d',
        {
          willReadFrequently:
            true,
        },
      )

    if (!context) {
      throw new Error(
        'El navegador no pudo crear el procesador de imagen.',
      )
    }

    context.imageSmoothingEnabled =
      false

    context.drawImage(
      image,
      0,
      0,
      width,
      height,
    )

    const imageData =
      context.getImageData(
        0,
        0,
        width,
        height,
      )

    let result =
      tryDecode(
        imageData.data,
        width,
        height,
      )

    if (result?.data) {
      return result.data
    }

    const thresholds = [
      120,
      140,
      160,
      180,
      200,
      220,
    ]

    for (
      const threshold
      of thresholds
    ) {
      const pixels =
        createThresholdPixels(
          imageData.data,
          threshold,
        )

      result =
        tryDecode(
          pixels,
          width,
          height,
        )

      if (result?.data) {
        return result.data
      }
    }

    throw new Error(
      'No fue posible leer el contenido del código QR.',
    )
  }

export const generateCleanQr =
  async (qrToken) => {
    if (!qrToken) {
      throw new Error(
        'No existe contenido para generar el QR.',
      )
    }

    return await QRCode
      .toDataURL(
        qrToken,
        {
          type:
            'image/png',

          errorCorrectionLevel:
            'M',

          width: 900,

          margin: 6,

          color: {
            dark:
              '#000000',

            light:
              '#FFFFFF',
          },
        },
      )
  }

// Cambia la representación visual sin alterar el token cifrado por Laravel.
export const rebuildBackendQr =
  async (backendQr) => {
    const originalImage =
      normalizeQrImage(
        backendQr,
      )

    const token =
      await decodeQrImage(
        originalImage,
      )

    const cleanImage =
      await generateCleanQr(
        token,
      )

    return {
      token,
      originalImage,
      cleanImage,
    }
  }

export const fileToDataUrl =
  (file) => {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader()

        reader.onload = () => {
          resolve(
            reader.result,
          )
        }

        reader.onerror = () => {
          reject(
            new Error(
              'No fue posible leer la imagen seleccionada.',
            ),
          )
        }

        reader.readAsDataURL(
          file,
        )
      },
    )
  }