
window.addEventListener("DOMContentLoaded", async () => {
  const groupList = document.getElementById("groupList");
  const qrImage = document.getElementById("qrImage");
  const modalParticipantList = document.getElementById("modalParticipantList");
  const downloadExcelBtn = document.getElementById("downloadExcelBtn");

  let currentParticipants = [];
  let currentGroupName = "";

  window.whatsappAPI.onQRCode((dataUrl) => {
    qrImage.src = dataUrl;
  });

  groupList.innerHTML = (
   ` <li class="list-group-item d-flex align-items-center justify-content-center py-4">
      <div class="text-center text-muted">
        <i class="bi bi-hourglass-split fs-4 mb-2 d-block"></i>
        <span>Esperando a que WhatsApp esté listo...</span>
      </div>
    </li>`
  );

  const waitForReady = async () => {
    while (!(await window.whatsappAPI.isReady())) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  await waitForReady();
  qrImage.style.display = "none";
  groupList.innerHTML = "";

  try {
    const groups = await window.whatsappAPI.getGroups();
    groups.forEach((group) => {
      const li = document.createElement("li");
      li.className =
        "list-group-item list-group-item-action d-flex align-items-center py-3";
      li.innerHTML = `
        <div class="d-flex align-items-center w-100">
          <div class="bg-success rounded-circle d-flex align-items-center justify-content-center me-3" 
               style="width: 40px; height: 40px;">
            <i class="bi bi-people-fill text-white"></i>
          </div>
          <div class="flex-grow-1">
            <h6 class="mb-1 fw-semibold">${group.name}</h6>
            <small class="text-muted">Toca para ver participantes</small>
          </div>
          <i class="bi bi-chevron-right text-muted"></i>
        </div>`;

      li.style.cursor = "pointer";
      li.onclick = async () => {
        const participants = await window.whatsappAPI.getParticipants(group.id);

        currentParticipants = participants.map((number) =>
          number.replace(/^(\+?\d{1,3})/, "")
        );
        currentGroupName = group.name;

        modalParticipantList.innerHTML = "";
        currentParticipants.forEach((cleaned) => {
          const li = document.createElement("li");
          li.className = "list-group-item d-flex align-items-center py-2";
          li.innerHTML = `
            <div class="bg-info rounded-circle d-flex align-items-center justify-content-center me-3"
                style="width: 32px; height: 32px;">
              <i class="bi bi-person-fill text-white" style="font-size: 0.8rem;"></i>
            </div>
            <span class="fw-medium">${cleaned}</span>`;
          modalParticipantList.appendChild(li);
        });

        const modal = new bootstrap.Modal(
          document.getElementById("participantsModal")
        );
        modal.show();
      };

      groupList.appendChild(li);
    });

    // ✅ Usa la API de preload para exportar Excel
    downloadExcelBtn.addEventListener("click", () => {
      window.xlsxAPI.exportToExcel(currentParticipants, currentGroupName);
    });
  } catch (err) {
    groupList.innerHTML = ` <li class="list-group-item">
      <div class="alert alert-danger mb-0 d-flex align-items-center">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <span>Error: ${err.message}</span>
      </div>
    </li>`;
  }
});
