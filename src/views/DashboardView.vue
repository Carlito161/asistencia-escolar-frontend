<script setup>
import AppLayout from '../components/AppLayout.vue'
</script>

<template>
  <AppLayout>

    <div class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p>
          Resumen general del sistema de asistencia.
        </p>
      </div>
    </div>

    <div class="stats-grid">

      <div class="stat-card">
        <span>Estudiantes</span>
        <strong>0</strong>
        <small>Total registrados</small>
      </div>

      <div class="stat-card">
        <span>Asistencias</span>
        <strong>0</strong>
        <small>Registradas hoy</small>
      </div>

      <div class="stat-card">
        <span>Ausencias</span>
        <strong>0</strong>
        <small>Registradas hoy</small>
      </div>

      <div class="stat-card">
        <span>Cursos</span>
        <strong>0</strong>
        <small>Total activos</small>
      </div>

    </div>

    <div class="content-grid">

      <div class="panel">
        <h3>Asistencia reciente</h3>

        <div class="empty-state">
          <p>
            Aún no hay información disponible.
          </p>
        </div>
      </div>

      <div class="panel">
        <h3>Resumen de hoy</h3>

        <div class="summary-item">
          <span>Presentes</span>
          <strong>0</strong>
        </div>

        <div class="summary-item">
          <span>Ausentes</span>
          <strong>0</strong>
        </div>

        <div class="summary-item">
          <span>Retrasos</span>
          <strong>0</strong>
        </div>
      </div>

    </div>

  </AppLayout>
</template>

<style scoped>
.page-header {
  margin-bottom: 28px;
}

.page-header h1 {
  margin: 0;

  color: #152536;

  font-size: 28px;
}

.page-header p {
  margin: 6px 0 0;

  color: #667085;

  font-size: 14px;
}

.stats-grid {
  display: grid;

  grid-template-columns:
    repeat(4, 1fr);

  gap: 18px;

  margin-bottom: 24px;
}

.stat-card {
  padding: 22px;

  background: white;

  border-radius: 14px;

  box-shadow:
    0 5px 20px
    rgba(15, 61, 110, 0.06);
}

.stat-card span {
  display: block;

  margin-bottom: 10px;

  color: #667085;

  font-size: 13px;
}

.stat-card strong {
  display: block;

  color: #152536;

  font-size: 30px;
}

.stat-card small {
  display: block;

  margin-top: 6px;

  color: #98a2b3;
}

.content-grid {
  display: grid;

  grid-template-columns: 2fr 1fr;

  gap: 20px;
}

.panel {
  padding: 22px;

  background: white;

  border-radius: 14px;

  box-shadow:
    0 5px 20px
    rgba(15, 61, 110, 0.06);
}

.panel h3 {
  margin: 0 0 20px;

  color: #344054;

  font-size: 16px;
}

.empty-state {
  min-height: 190px;

  display: flex;
  justify-content: center;
  align-items: center;

  color: #98a2b3;
}

.summary-item {
  display: flex;
  justify-content: space-between;

  padding: 14px 0;

  border-bottom: 1px solid #f0f2f5;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-item span {
  color: #667085;
}

.summary-item strong {
  color: #152536;
}

@media (max-width: 1050px) {
  .stats-grid {
    grid-template-columns:
      repeat(2, 1fr);
  }
}

@media (max-width: 700px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>