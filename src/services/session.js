export const homeForRole = (role) => ({
  Administrador: '/admin',
  Docente: '/docente',
  Alumno: '/estudiante',
})[role] || '/login'

export const clearSession = () => {
  for (const key of ['access_token', 'refresh_token', 'auth_role']) {
    localStorage.removeItem(key)
  }
}
