// server/src/controllers/site.controller.js
// Endpoints públicos con contenido "informativo" para la landing.
// Edita aquí mismo la agenda y ponentes según necesites.

export async function getAgenda(req, res) {
  try {
    // Puedes mover esto a BD en el futuro.
    const agenda = [
      // Día 1
      {
        day: "Día 1",
        date: "2025-10-01",
        items: [
          { time: "09:00", title: "Acreditación y apertura", place: "Hall principal" },
          { time: "10:00", title: "Intro a React (Taller)", place: "Aula 201" },
          { time: "14:00", title: "APIs con Node/Express (Taller)", place: "Lab 2" },
          { time: "18:00", title: "Networking", place: "Patio central" },
        ],
      },
      // Día 2
      {
        day: "Día 2",
        date: "2025-10-02",
        items: [
          { time: "09:00", title: "Keynote: Futuro del Desarrollo", place: "Auditorio" },
          { time: "11:00", title: "Competencia: Algoritmos II", place: "Lab 1" },
          { time: "16:30", title: "Clausura y premiación", place: "Auditorio" },
        ],
      },
    ];
    res.json(agenda);
  } catch (e) {
    console.error("getAgenda error:", e);
    res.status(500).json({ error: "No se pudo cargar la agenda" });
  }
}

export async function getSpeakers(req, res) {
  try {
    // Ajusta nombres, bios y fotos (pueden ser URLs externas o /img/… en /public).
    const speakers = [
      {
        id: 1,
        name: "Ana Torres",
        role: "Frontend Engineer",
        talk: "Construyendo UI escalables con React",
        photo: "/img/speakers/ana.jpg", // opcional
        bio: "Desarrolladora con 7+ años en React y ecosistema JS.",
      },
      {
        id: 2,
        name: "Luis García",
        role: "Backend Engineer",
        talk: "Buenas prácticas con Node.js/Express",
        photo: "/img/speakers/luis.jpg",
        bio: "Apasionado por APIs, rendimiento y DX.",
      },
      {
        id: 3,
        name: "Invitado Sorpresa",
        role: "Tech Speaker",
        talk: "Tendencias en IA aplicada",
        photo: "",
        bio: "Explorando casos prácticos de IA en productos.",
      },
    ];
    res.json(speakers);
  } catch (e) {
    console.error("getSpeakers error:", e);
    res.status(500).json({ error: "No se pudieron cargar los ponentes" });
  }
}
