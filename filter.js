// Script untuk fetch provinsi dan populate dropdown
window.addEventListener('DOMContentLoaded', async function() {
    const provSel = document.getElementById('provinsiSelect');
    const kabSel = document.getElementById('kabupatenSelect');
    if (!provSel || !kabSel) return;
    // Fetch data provinsi
    await fetchProvinsi();
    // Fetch provinsi dari API lokal
    async function fetchProvinsi() {
        try {
            const response = await fetch('/api/provinsi');
            const data = await response.json();
            const provSel = document.getElementById('provinsiSelect');
            provSel.innerHTML = '<option value="">-- Pilih Provinsi --</option>';
            data.forEach(prov => {
                provSel.innerHTML += `<option value="${prov.kode}">${prov.nama}</option>`;
            });
        } catch (error) {
            console.error('Gagal mengambil data provinsi:', error);
        }
    }
    // Fetch kabupaten berdasarkan provinsi
    // Perbaiki fetchKabupaten agar selalu cek array
    async function fetchKabupaten(provKode) {
        try {
            const response = await fetch(`/api/kabupaten?provinsi=${provKode}`);
            const data = await response.json();
            const kabSel = document.getElementById('kabupatenSelect');
            kabSel.innerHTML = '<option value="">Semua</option>';
            if (Array.isArray(data)) {
                data.forEach(kab => {
                    kabSel.innerHTML += `<option value="${kab.kode}">${kab.nama}</option>`;
                });
                kabSel.disabled = false;
            } else {
                console.error('Data kabupaten bukan array:', data);
                kabSel.innerHTML += '<option value="">(Data tidak tersedia)</option>';
                kabSel.disabled = false;
            }
        } catch (error) {
            console.error('Gagal mengambil data kabupaten:', error);
        }
    }
    // Kode dan nama provinsi akan diambil dari database
    const fetchProvinsiFromDatabase = async () => {
        try {
            const response = await fetch('/api/provinsi');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Gagal mengambil data provinsi dari database:', error);
            return [];
        }
    };

    // Fungsi untuk mengisi dropdown provinsi
    const populateProvinsiDropdown = async () => {
        const provList = await fetchProvinsiFromDatabase();
        const provSel = document.getElementById('provinsiSelect');
        provSel.innerHTML = '<option value="">-- Pilih Provinsi --</option>';
        provList.forEach(prov => {
            provSel.innerHTML += `<option value="${prov.kode}">${prov.nama}</option>`;
        });
    };

    await populateProvinsiDropdown();

    // Event: provinsi dipilih, populate kabupaten
    provSel.addEventListener('change', async function() {
        const kabSel = document.getElementById('kabupatenSelect');
        kabSel.innerHTML = '<option value="">Semua</option>';
        kabSel.disabled = true;
        if (this.value) {
            await fetchKabupaten(this.value);
            // Ambil nama provinsi dari dropdown
            const provinsiSelect = document.getElementById('provinsiSelect');
            const provNama = provinsiSelect.options[provinsiSelect.selectedIndex].text;
            // Jika ingin fetch kabupaten dari API eksternal, bisa lanjutkan di sini
        }
    });
});