<script setup>
import {
  ref,
} from 'vue'

import {
  useRouter,
} from 'vue-router'

import {
  useAuthStore,
} from '@/stores/auth'

const router =
  useRouter()

const authStore =
  useAuthStore()

const email =
  ref('')

const password =
  ref('')

const loading =
  ref(false)

const error =
  ref('')

const showPassword =
  ref(false)

const submitLogin =
  async () => {
    error.value = ''

    if (
      !email.value ||
      !password.value
    ) {
      error.value =
        'Ingresa tu correo y contraseña.'

      return
    }

    loading.value = true

    try {
      const result =
        await authStore.login({
          email:
            email.value,

          password:
            password.value,
        })

      await router.replace(
        result.homeRoute,
      )
    } catch (requestError) {
      console.error(
        'Error login:',
        requestError,
      )

      const status =
        requestError
          ?.response
          ?.status

      const message =
        requestError
          ?.response
          ?.data
          ?.message

      if (status === 401) {
        error.value =
          'Correo o contraseña incorrectos.'

        return
      }

      if (status === 422) {
        error.value =
          'Revisa la información ingresada.'

        return
      }

      error.value =
        message ||
        requestError
          ?.message ||
        'No fue posible iniciar sesión.'
    } finally {
      loading.value = false
    }
  }
</script>

<template>
  <div class="login-page">

    <div class="login-panel">

      <div class="brand">

        <div class="brand-icon">
          QR
        </div>

        <div>
          <h2>
            Asistencia QR
          </h2>

          <span>
            Control escolar
          </span>
        </div>

      </div>

      <div class="welcome">

        <span class="welcome-label">
          Bienvenido
        </span>

        <h1>
          Inicia sesión
        </h1>

        <p>
          Ingresa con las credenciales
          proporcionadas por tu institución.
        </p>

      </div>

      <form
        class="login-form"
        @submit.prevent="
          submitLogin
        "
      >

        <div class="form-group">

          <label>
            Correo electrónico
          </label>

          <div class="input-wrapper">

            <span>
              ✉
            </span>

            <input
              v-model="email"
              type="email"
              autocomplete="username"
              placeholder="correo@institucion.edu"
              :disabled="loading"
            />

          </div>

        </div>

        <div class="form-group">

          <label>
            Contraseña
          </label>

          <div class="input-wrapper">

            <span>
              🔒
            </span>

            <input
              v-model="password"
              :type="
                showPassword
                  ? 'text'
                  : 'password'
              "
              autocomplete="current-password"
              placeholder="Contraseña"
              :disabled="loading"
            />

            <button
              type="button"
              class="password-toggle"
              @click="
                showPassword =
                  !showPassword
              "
            >
              {{
                showPassword
                  ? 'Ocultar'
                  : 'Ver'
              }}
            </button>

          </div>

        </div>

        <div
          v-if="error"
          class="error-message"
        >
          <span>
            !
          </span>

          {{ error }}
        </div>

        <button
          type="submit"
          class="login-button"
          :disabled="loading"
        >

          <span
            v-if="loading"
            class="spinner"
          ></span>

          {{
            loading
              ? 'Ingresando...'
              : 'Iniciar sesión'
          }}

        </button>

      </form>

      <div class="security-message">
        🔐 Tu sesión está protegida
        mediante autenticación del sistema.
      </div>

    </div>

    <div class="illustration-panel">

      <div class="illustration-content">

        <div class="illustration-icon">
          🎓
        </div>

        <h2>
          Control de asistencia
          simple y rápido
        </h2>

        <p>
          Registra y consulta la
          asistencia escolar mediante
          códigos QR.
        </p>

        <div class="features">

          <span>
            ✓ Registro mediante QR
          </span>

          <span>
            ✓ Historial de asistencia
          </span>

          <span>
            ✓ Gestión por perfiles
          </span>

        </div>

      </div>

    </div>

  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.login-page {
  min-height: 100vh;

  display: grid;

  grid-template-columns:
    minmax(430px, 0.9fr)
    minmax(500px, 1.1fr);

  background: #f6f9fc;
}

.login-panel {
  padding:
    55px clamp(
      45px,
      7vw,
      100px
    );

  display: flex;

  flex-direction: column;

  justify-content: center;

  background: white;
}

.brand {
  display: flex;

  align-items: center;

  gap: 12px;

  margin-bottom: 70px;
}

.brand-icon {
  width: 48px;

  height: 48px;

  display: grid;

  place-items: center;

  background: #e5f2ff;

  color: #1974cf;

  border-radius: 13px;

  font-weight: 800;
}

.brand h2 {
  margin: 0;

  color: #17375d;

  font-size: 19px;
}

.brand span {
  color: #8998a9;

  font-size: 11px;
}

.welcome-label {
  color: #237acd;

  font-size: 12px;

  font-weight: 700;
}

.welcome h1 {
  margin:
    7px 0;

  color: #112e55;

  font-size: 38px;
}

.welcome p {
  max-width: 420px;

  margin:
    0 0 29px;

  color: #788ba1;

  line-height: 1.6;
}

.login-form {
  width: 100%;

  max-width: 440px;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;

  margin-bottom: 7px;

  color: #415d79;

  font-size: 12px;

  font-weight: 700;
}

.input-wrapper {
  min-height: 52px;

  padding:
    0 14px;

  display: flex;

  align-items: center;

  gap: 10px;

  border:
    1px solid #dbe5ee;

  border-radius: 12px;

  background: white;
}

.input-wrapper:focus-within {
  border-color: #2883db;

  box-shadow:
    0 0 0 3px
    rgba(40, 131, 219, 0.08);
}

.input-wrapper input {
  flex: 1;

  min-width: 0;

  border: 0;

  outline: none;

  font: inherit;

  color: #29465f;
}

.password-toggle {
  border: 0;

  background: transparent;

  color: #2879c6;

  font-size: 10px;

  font-weight: 700;

  cursor: pointer;
}

.error-message {
  margin-bottom: 14px;

  padding: 12px 14px;

  display: flex;

  align-items: center;

  gap: 8px;

  background: #fff0f0;

  color: #bd4545;

  border-radius: 10px;

  font-size: 12px;
}

.error-message span {
  width: 23px;

  height: 23px;

  display: grid;

  place-items: center;

  background: #ffdede;

  border-radius: 50%;

  font-weight: 800;
}

.login-button {
  width: 100%;

  height: 54px;

  display: flex;

  justify-content: center;

  align-items: center;

  gap: 10px;

  border: 0;

  border-radius: 12px;

  background:
    linear-gradient(
      135deg,
      #208bfb,
      #1769d5
    );

  color: white;

  font-size: 15px;

  font-weight: 700;

  cursor: pointer;
}

.login-button:disabled {
  opacity: 0.7;

  cursor: wait;
}

.spinner {
  width: 17px;

  height: 17px;

  border:
    2px solid
    rgba(255, 255, 255, 0.4);

  border-top-color: white;

  border-radius: 50%;

  animation:
    spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform:
      rotate(360deg);
  }
}

.security-message {
  max-width: 440px;

  margin-top: 20px;

  color: #8997a7;

  text-align: center;

  font-size: 10px;
}

.illustration-panel {
  display: grid;

  place-items: center;

  padding: 60px;

  background:
    linear-gradient(
      145deg,
      #e9f5ff,
      #f1edff
    );
}

.illustration-content {
  max-width: 470px;

  text-align: center;
}

.illustration-icon {
  margin-bottom: 25px;

  font-size: 125px;
}

.illustration-content h2 {
  margin:
    0 auto 13px;

  color: #15365c;

  font-size: 31px;
}

.illustration-content p {
  color: #667f98;

  line-height: 1.6;
}

.features {
  margin-top: 27px;

  display: flex;

  justify-content: center;

  flex-wrap: wrap;

  gap: 9px;
}

.features span {
  padding:
    8px 12px;

  background:
    rgba(255, 255, 255, 0.72);

  color: #466781;

  border-radius: 20px;

  font-size: 10px;
}

@media (
  max-width: 850px
) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .illustration-panel {
    display: none;
  }

  .login-panel {
    padding:
      40px 25px;
  }

  .brand {
    margin-bottom: 50px;
  }

  .login-form {
    max-width: none;
  }
}
</style>