// Script untuk fetch provinsi dan populate dropdown
window.addEventListener('DOMContentLoaded', async function() {
    const provSel = document.getElementById('provinsiSelect');
    
    if (!provSel) {
        console.error('Elemen provinsiSelect tidak ditemukan');
        return;
    }

    // Inisialisasi dropdown sudah tidak diperlukan karena kabupaten dihapus

    // Fungsi untuk mengambil data provinsi
    async function fetchProvinsi() {
        try {
            const response = await fetch('/api/provinsi');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Gagal mengambil data provinsi:', error);
            throw error;
        }
    }

    // Fungsi fetchKabupaten sudah dihapus karena tidak diperlukan lagi

    // Fungsi untuk mengisi dropdown provinsi
    async function populateProvinsi() {
        try {
            const provinsi = await fetchProvinsi();
            provSel.innerHTML = '<option value="">-- Pilih Provinsi --</option>';
            
            if (Array.isArray(provinsi) && provinsi.length > 0) {
                provinsi.forEach(prov => {
                    if (prov && prov.kode && prov.nama) {
                        provSel.innerHTML += `<option value="${prov.kode}">${prov.nama}</option>`;
                    }
                });
                provSel.disabled = false;
            } else {
                console.error('Data provinsi tidak ditemukan');
                provSel.innerHTML = '<option value="">Data provinsi tidak tersedia</option>';
            }
        } catch (error) {
            console.error('Error saat memuat provinsi:', error);
            provSel.innerHTML = '<option value="">Gagal memuat data</option>';
        }
    }

    // Event listener untuk perubahan provinsi
    provSel.addEventListener('change', function() {
        const selectedProvKode = this.value;
        console.log('Provinsi dipilih:', selectedProvKode);
        // Tidak ada lagi tindakan yang diperlukan karena kabupaten sudah dihapus
    });

    // Inisialisasi
    populateProvinsi();
});