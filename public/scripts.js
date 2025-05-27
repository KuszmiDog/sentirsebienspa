document.addEventListener("DOMContentLoaded", () => {
  const serviciosContainer = document.getElementById("servicios-container");

  // Función para obtener los servicios desde el backend
  const fetchServicios = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/servicios");
      const servicios = await response.json();

      // Generar etiquetas para cada servicio
      servicios.forEach((servicio) => {
        const servicioCard = document.createElement("div");
        servicioCard.className = "col-md-4";

        servicioCard.innerHTML = `
          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title">${servicio.nombre}</h5>
              <p class="card-text">${servicio.descripcion}</p>
              <span class="badge bg-primary">${servicio.tipo}</span>
            </div>
          </div>
        `;

        serviciosContainer.appendChild(servicioCard);
      });
    } catch (error) {
      console.error("Error al obtener los servicios:", error);
    }
  };

  // Llamar a la función para obtener los servicios
  fetchServicios();

  document.querySelector('a[href="#servicios"]').addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("servicios").scrollIntoView({ behavior: "smooth" });
  });
});

<script src="scripts.js"></script>