const { ipcRenderer, contextBridge } = require('electron');
const XLSX = require('xlsx');

contextBridge.exposeInMainWorld('whatsappAPI', {
  getGroups: () => ipcRenderer.invoke('get-groups'),
  getParticipants: (groupId) => ipcRenderer.invoke('get-group-participants', groupId),
  isReady: () => ipcRenderer.invoke('is-ready'),
  onQRCode: (callback) => ipcRenderer.on('qr-code', (event, data) => callback(data)),
  logout: () => ipcRenderer.invoke('logout')  // <- AÑADIDO
});

contextBridge.exposeInMainWorld('xlsxAPI', {
  exportToExcel: (participants, groupName) => {
    const wsData = [["Número"], ...participants.map(p => [p])];
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Participantes");

    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Participantes_${groupName.replace(/\s+/g, "_")}.xlsx`;
    a.click();
  }
});
