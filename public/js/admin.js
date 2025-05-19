// Global variables
let currentPage = 1;
const itemsPerPage = 10;
let schools = [];
let filteredSchools = [];
window.provinsiData = [];
window.selectedProvinceCode = null;

// Variabel untuk peta
let schoolMap = null;
let schoolMarker = null;
const defaultMapCenter = [-2.5489, 118.0149]; // Koordinat default (tengah Indonesia)

// DOM Elements
const schoolTable = document.getElementById('schoolTable');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const provinceFilter = document.getElementById('provinceFilter');
const levelFilter = document.getElementById('levelFilter');

// Check if we're on the admin page
const isAdminPage = window.location.pathname.includes('admin');

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Halaman admin dimuat');
    
    try {
        console.log('Menyiapkan event listeners...');
        setupEventListeners();
        
        try {
            console.log('Memuat data provinsi...');
            await loadProvinces();
            console.log('Data provinsi berhasil dimuat');
        } catch (provinceError) {
            console.error('Gagal memuat provinsi:', provinceError);
            showAlert('Gagal memuat data provinsi. Beberapa fitur mungkin tidak berfungsi dengan baik.', 'error');
        }
        
        try {
            console.log('Memuat data sekolah...');
            await loadSchools();
            console.log('Data sekolah berhasil dimuat');
            
            // Render the table with initial data
            console.log('Merender tabel sekolah...');
            renderSchoolTable();
            
            // Initialize pagination
            console.log('Menyiapkan pagination...');
            renderPagination();
        } catch (schoolsError) {
            console.error('Gagal memuat data sekolah:', schoolsError);
            showAlert('Gagal memuat data sekolah. Silakan refresh halaman.', 'error');
        }
    } catch (error) {
        console.error('Error inisialisasi halaman:', error);
        showAlert('Terjadi kesalahan saat memuat halaman. Silakan refresh halaman.', 'error');
    }
});

// Setup event listeners
function setupEventListeners() {
    // School form submission
    const schoolForm = document.getElementById('schoolForm');
    if (schoolForm) {
        schoolForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveSchool();
        });
    }
    
    // Nilai (value) slider
    const nilaiInput = document.getElementById('nilai');
    const nilaiDisplay = document.getElementById('nilaiDisplay');
    const colorPreview = document.getElementById('colorPreview');
    
    if (nilaiInput && nilaiDisplay && colorPreview) {
        nilaiInput.addEventListener('input', function() {
            const value = this.value;
            nilaiDisplay.textContent = value;
            
            // Update color preview
            const color = getColorByNilai(value);
            colorPreview.style.backgroundColor = color;
        });
    }
    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            currentPage = 1;
            filterSchools();
            renderSchoolTable();
            renderPagination();
        }, 300));
    }
    
    // Province filter
    if (provinceFilter) {
        provinceFilter.addEventListener('change', function() {
            // Filter schools
            currentPage = 1;
            filterSchools();
            renderSchoolTable();
            renderPagination();
        });
    }
    
    // District filter sudah dihapus
    // Kode untuk district filter dihapus karena fitur kabupaten/kota sudah tidak digunakan
    
    // Level filter
    if (levelFilter) {
        levelFilter.addEventListener('change', function() {
            currentPage = 1;
            filterSchools();
            renderSchoolTable();
            renderPagination();
        });
    }
    
    // Add school button
    const addSchoolBtn = document.getElementById('addSchoolBtn');
    if (addSchoolBtn) {
        addSchoolBtn.addEventListener('click', function() {
            window.location.href = '/sekolah/baru';
        });
    }
}

// Load provinces for filter and form
async function loadProvinces() {
    console.log('Memulai pemuatan data provinsi...');
    try {
        console.log('Mengambil data dari /api/provinces...');
        const response = await fetch('/api/provinces');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const provinces = await response.json();
        console.log('Data provinsi mentah:', provinces);
        
        if (!provinces) {
            throw new Error('Tidak ada data yang diterima dari server');
        }
        
        // Pastikan provinces adalah array
        const provincesArray = Array.isArray(provinces) ? provinces : [];
        console.log('Data provinsi yang akan diproses:', provincesArray);
        
        if (!Array.isArray(provincesArray)) {
            throw new Error('Format data provinsi tidak valid');
        }
        
        if (provincesArray.length === 0) {
            console.warn('Data provinsi kosong');
            showAlert('Data provinsi kosong. Pastikan database sudah terisi dengan benar.', 'warning');
            return;
        }
        
        window.provinsiData = provincesArray;
        
        // Sort provinces alphabetically
        provincesArray.sort((a, b) => {
            const nameA = (a.nama || '').toLowerCase();
            const nameB = (b.nama || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
        
        // Add options to filter dropdown
        if (provinceFilter) {
            console.log('Menambahkan opsi ke filter provinsi...');
            // Reset and add default option
            provinceFilter.innerHTML = '<option value="">Semua Provinsi</option>';
            
            // Add options to select
            provincesArray.forEach(province => {
                if (province && province.kode && province.nama) {
                    const option = document.createElement('option');
                    option.value = province.kode;
                    option.textContent = province.nama;
                    provinceFilter.appendChild(option);
                } else {
                    console.warn('Data provinsi tidak valid:', province);
                }
            });
            console.log('Filter provinsi selesai diisi');
        } else {
            console.warn('Element provinceFilter tidak ditemukan di DOM');
        }
        
        // Add options to form dropdown
        const formProvinceSelect = document.getElementById('provinsi');
        if (formProvinceSelect) {
            console.log('Menambahkan opsi ke form provinsi...');
            // Reset and add default option
            formProvinceSelect.innerHTML = '<option value="">Pilih Provinsi</option>';
            
            // Add options to select
            provincesArray.forEach(province => {
                if (province && province.kode && province.nama) {
                    const option = document.createElement('option');
                    option.value = province.kode;
                    option.textContent = province.nama;
                    formProvinceSelect.appendChild(option);
                }
            });
            console.log('Form provinsi selesai diisi');
        } else {
            console.warn('Element form provinsi tidak ditemukan di DOM');
        }
        
        console.log('Pemuatan data provinsi selesai');
    } catch (error) {
        console.error('Error loading provinces:', error);
        showAlert('Gagal memuat data provinsi. Silakan refresh halaman. ' + error.message, 'error');
    }
}

// Load schools data
async function loadSchools() {
    try {
        const response = await fetch('/api/sekolah?all=true');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        schools = data.data || [];
        filteredSchools = [...schools];
        
        console.log(`Loaded ${schools.length} schools`);
    } catch (error) {
        console.error('Error loading schools:', error);
        showAlert('Gagal memuat data sekolah', 'error');
    }
}

// Filter schools based on search and filters
function filterSchools() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const provinceCode = provinceFilter ? provinceFilter.value : '';
    const level = levelFilter ? levelFilter.value : '';
    
    filteredSchools = schools.filter(school => {
        // Check search term
        const matchesSearch = !searchTerm || 
            (school.nama_sekolah && school.nama_sekolah.toLowerCase().includes(searchTerm)) ||
            (school.npsn && school.npsn.toLowerCase().includes(searchTerm));
        
        // Check province
        const matchesProvince = !provinceCode || school.kode_provinsi === provinceCode;
        
        // Check level
        const matchesLevel = !level || school.jenjang === level;
        
        return matchesSearch && matchesProvince && matchesLevel;
    });
    
    // Update pagination
    currentPage = 1;
    updatePaginationInfo(0, 0, filteredSchools.length);
}

// Render the school table with current data
function renderSchoolTable() {
    if (!schoolTable) {
        console.error('School table element not found');
        return;
    }
    
    const tableBody = schoolTable.querySelector('tbody');
    if (!tableBody) {
        console.error('Table body not found');
        return;
    }
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedSchools = filteredSchools.slice(startIndex, endIndex);
    
    // Update pagination info
    updatePaginationInfo(
        filteredSchools.length > 0 ? startIndex + 1 : 0,
        Math.min(endIndex, filteredSchools.length),
        filteredSchools.length
    );
    
    // Check if we have schools to display
    if (paginatedSchools.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                Tidak ada data sekolah yang sesuai dengan filter
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }
        // Create rows for each school
    paginatedSchools.forEach((school, index) => {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
        
        const provinsi = window.provinsiData.find(p => p.kode === school.kode_provinsi);
        const provinsiNama = provinsi ? provinsi.nama : '-';
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${startIndex + index + 1}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${school.nama || '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${school.npsn || '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRatingColor(school.nilai)}">
                    ${school.nilai || '-'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${provinsiNama}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <a href="javascript:void(0)" onclick="editSchool(${school.id})" class="text-indigo-600 hover:text-indigo-900">Edit</a>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}
// Helper function for delayed execution (debounce)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `p-4 mb-4 rounded-md ${
        type === 'error' ? 'bg-red-50 text-red-800' : 
        type === 'success' ? 'bg-green-50 text-green-800' : 
        'bg-blue-50 text-blue-800'
    }`;
    
    alert.innerHTML = `
        <div class="flex">
            <div class="flex-shrink-0">
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
            </div>
            <div class="ml-3">
                <p class="text-sm">${escapeHtml(message)}</p>
            </div>
            <div class="ml-auto pl-3">
                <div class="-mx-1.5 -my-1.5">
                    <button type="button" class="inline-flex rounded-md p-1.5 text-gray-500 hover:bg-gray-100 focus:outline-none">
                        <span class="sr-only">Dismiss</span>
                        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add click event to close button
    const closeBtn = alert.querySelector('button');
    closeBtn.addEventListener('click', () => {
        alertContainer.removeChild(alert);
    });
    
    // Auto remove after 5 seconds
    alertContainer.appendChild(alert);
    setTimeout(() => {
        if (alert.parentNode === alertContainer) {
            alertContainer.removeChild(alert);
        }
    }, 5000);
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Update pagination info
function updatePaginationInfo(start, end, total) {
    // Skip pagination updates if we're not on the admin page
    if (!isAdminPage) {
        return;
    }
    
    const startItem = document.getElementById('startItem');
    const endItem = document.getElementById('endItem');
    const totalItems = document.getElementById('totalItems');
    
    if (startItem) startItem.textContent = start;
    if (endItem) endItem.textContent = end;
    if (totalItems) totalItems.textContent = total;
}

// Get color class based on rating
function getRatingColor(rating) {
    if (!rating) return 'bg-gray-100 text-gray-800';
    
    const numericRating = parseFloat(rating);
    if (numericRating >= 8) return 'bg-green-100 text-green-800';
    if (numericRating >= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
}

// Inisialisasi peta untuk form sekolah
function initializeMap(lat, lng) {
    // Hapus peta sebelumnya jika ada
    if (schoolMap) {
        schoolMap.remove();
        schoolMap = null;
        schoolMarker = null;
    }
    
    // Gunakan koordinat yang diberikan atau default ke tengah Indonesia
    const mapCenter = [lat || defaultMapCenter[0], lng || defaultMapCenter[1]];
    
    // Inisialisasi peta
    schoolMap = L.map('mapContainer').setView(mapCenter, 5);
    
    // Tambahkan layer peta
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(schoolMap);
    
    // Tambahkan marker
    schoolMarker = L.marker(mapCenter, {
        draggable: true
    }).addTo(schoolMap);
    
    // Update koordinat saat marker dipindahkan
    schoolMarker.on('dragend', function(event) {
        const marker = event.target;
        const position = marker.getLatLng();
        document.getElementById('latitude').value = position.lat.toFixed(6);
        document.getElementById('longitude').value = position.lng.toFixed(6);
    });
    
    // Update koordinat saat peta diklik
    schoolMap.on('click', function(event) {
        const position = event.latlng;
        document.getElementById('latitude').value = position.lat.toFixed(6);
        document.getElementById('longitude').value = position.lng.toFixed(6);
        
        // Pindahkan marker
        schoolMarker.setLatLng(position);
    });
    
    // Perbaiki tampilan peta setelah modal ditampilkan
    setTimeout(() => {
        schoolMap.invalidateSize();
    }, 100);
}

// Edit school function - loads school data and opens the edit form
async function editSchool(schoolId) {
    try {
        // Show loading state
        const modal = document.getElementById('schoolModal');
        if (modal) {
            // Tampilkan modal
            modal.style.display = 'flex';
        }
        
        // Fetch school data
        const response = await fetch(`/api/sekolah/${schoolId}`);
        if (!response.ok) {
            throw new Error('Gagal memuat data sekolah');
        }
        
        const school = await response.json();
        
        // Reset form
        const form = document.getElementById('schoolForm');
        form.reset();
        
        // Set form values
        document.getElementById('sekolahId').value = school.id;
        document.getElementById('nama').value = school.nama || '';
        document.getElementById('npsn').value = school.npsn || '';
        document.getElementById('alamat').value = school.alamat || '';
        
        // Set jenjang (education level)
        const jenjangSelect = document.getElementById('jenjang');
        if (jenjangSelect) {
            const jenjangValue = school.jenjang || '';
            for (let i = 0; i < jenjangSelect.options.length; i++) {
                if (jenjangSelect.options[i].value === jenjangValue) {
                    jenjangSelect.selectedIndex = i;
                    break;
                }
            }
        }
        
        // Set provinsi (province)
        const provinsiSelect = document.getElementById('provinsi');
        if (provinsiSelect) {
            const provinsiValue = school.kode_provinsi || '';
            for (let i = 0; i < provinsiSelect.options.length; i++) {
                if (provinsiSelect.options[i].value === provinsiValue) {
                    provinsiSelect.selectedIndex = i;
                    break;
                }
            }
        }
        
        // Set coordinates
        const latitude = school.latitude || defaultMapCenter[0];
        const longitude = school.longitude || defaultMapCenter[1];
        document.getElementById('latitude').value = latitude;
        document.getElementById('longitude').value = longitude;
        
        // Inisialisasi peta dengan koordinat sekolah
        setTimeout(() => {
            initializeMap(latitude, longitude);
        }, 300);
        
        // Set nilai (value)
        const nilaiInput = document.getElementById('nilai');
        const nilaiDisplay = document.getElementById('nilaiDisplay');
        const colorPreview = document.getElementById('colorPreview');
        
        if (nilaiInput && nilaiDisplay && colorPreview) {
            const nilai = school.nilai || 0;
            nilaiInput.value = nilai;
            nilaiDisplay.textContent = nilai;
            
            // Update color preview
            const color = getColorByNilai(nilai);
            colorPreview.style.backgroundColor = color;
        }
        
        // Update modal title
        document.getElementById('modalTitle').textContent = 'Edit Data Sekolah';
        
    } catch (error) {
        console.error('Error loading school data:', error);
        showAlert('Gagal memuat data sekolah', 'error');
        closeModal();
    }
}

// Helper function to get color based on nilai (similar to server-side function)
function getColorByNilai(nilai) {
    // Pastikan nilai antara 0-10
    const clampedNilai = Math.min(10, Math.max(0, parseFloat(nilai) || 0));
    
    // Hitung komponen warna (RGB)
    // Nilai 0: Hitam (0,0,0)
    // Nilai 5: Merah (255,0,0)
    // Nilai 10: Hijau (0,255,0)
    let r, g, b;
    
    if (clampedNilai <= 5) {
        // Dari hitam ke merah
        const factor = clampedNilai / 5;
        r = Math.round(255 * factor);
        g = 0;
        b = 0;
    } else {
        // Dari merah ke hijau
        const factor = (clampedNilai - 5) / 5;
        r = Math.round(255 * (1 - factor));
        g = Math.round(255 * factor);
        b = 0;
    }
    
    // Konversi ke hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Open modal function
function openModal() {
    const modal = document.getElementById('schoolModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Save school data function
async function saveSchool() {
    try {
        // Get form data
        const schoolId = document.getElementById('sekolahId').value;
        const nama = document.getElementById('nama').value;
        const npsn = document.getElementById('npsn').value;
        const alamat = document.getElementById('alamat').value;
        const jenjang = document.getElementById('jenjang').value;
        const kode_provinsi = document.getElementById('provinsi').value;
        const latitude = document.getElementById('latitude').value;
        const longitude = document.getElementById('longitude').value;
        const nilai = document.getElementById('nilai').value;
        
        // Validate required fields
        if (!nama || !jenjang || !kode_provinsi) {
            showAlert('Nama sekolah, jenjang, dan provinsi harus diisi', 'error');
            return;
        }
        
        // Prepare data object
        const schoolData = {
            nama_sekolah: nama,  // Server expects nama_sekolah, not nama
            npsn: npsn || null,
            alamat: alamat,
            jenjang: jenjang,
            kode_provinsi: kode_provinsi,
            latitude: latitude || null,
            longitude: longitude || null,
            nilai: nilai || 5.0,
            status: 'Negeri' // Default status if not provided
        };
        
        let url, method;
        
        if (schoolId) {
            // Update existing school
            url = `/api/sekolah/${schoolId}`;
            method = 'PUT';
        } else {
            // Create new school
            url = '/api/sekolah';
            method = 'POST';
        }
        
        // Send request to API
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(schoolData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error response:', errorData);
            throw new Error(errorData.error || errorData.message || 'Gagal menyimpan data sekolah');
        }
        
        const result = await response.json();
        
        // Show success message
        showAlert(schoolId ? 'Data sekolah berhasil diperbarui' : 'Data sekolah baru berhasil ditambahkan', 'success');
        
        // Close modal
        closeModal();
        
        // Reload schools data and update table
        await loadSchools();
        filterSchools();
        renderSchoolTable();
        renderPagination();
        
    } catch (error) {
        console.error('Error saving school:', error);
        showAlert(`Gagal menyimpan data sekolah: ${error.message}`, 'error');
    }
}

// Close modal function
function closeModal() {
    const modal = document.getElementById('schoolModal');
    if (modal) {
        modal.style.display = 'none';
        
        // Reset form
        const form = document.getElementById('schoolForm');
        if (form) {
            form.reset();
            form.removeAttribute('data-edit-mode');
        }
        
        // Hide validation errors
        const errorElements = document.querySelectorAll('.text-red-500');
        errorElements.forEach(el => el.textContent = '');
        
        // Destroy map to prevent memory leaks
        if (schoolMap) {
            schoolMap.remove();
            schoolMap = null;
            schoolMarker = null;
        }
    }
}

// Render pagination
function renderPagination() {
    // ...
    // Skip pagination rendering if we're not on the admin page
    if (!isAdminPage) {
        return;
    }
    
    console.log('Mengrender pagination...');
    
    if (!pagination) {
        console.error('Element pagination tidak ditemukan');
        return;
    }
    
    // Get pagination elements
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageNumbersContainer = document.getElementById('pageNumbers');
    
    if (!prevPageBtn || !nextPageBtn || !pageNumbersContainer) {
        console.error('Pagination elements not found');
        return;
    }
    
    // Clear page numbers
    pageNumbersContainer.innerHTML = '';
    
    // Update pagination info
    updatePaginationInfo(
        (currentPage - 1) * itemsPerPage + 1,
        Math.min(currentPage * itemsPerPage, filteredSchools.length),
        filteredSchools.length
    );
    
    if (!Array.isArray(filteredSchools) || filteredSchools.length <= itemsPerPage) {
        console.log('Tidak perlu pagination, jumlah data:', filteredSchools?.length || 0);
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
        return;
    }
    
    const totalPages = Math.ceil(filteredSchools.length / itemsPerPage);
    const maxPagesToShow = 5;
    let startPage, endPage;
    
    console.log(`Total halaman: ${totalPages}, Halaman saat ini: ${currentPage}`);
    
    // Calculate which page numbers to show
    if (totalPages <= maxPagesToShow) {
        startPage = 1;
        endPage = totalPages;
    } else {
        const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
        const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;
        
        if (currentPage <= maxPagesBeforeCurrent) {
            startPage = 1;
            endPage = maxPagesToShow;
        } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
            startPage = totalPages - maxPagesToShow + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - maxPagesBeforeCurrent;
            endPage = currentPage + maxPagesAfterCurrent;
        }
    }
    
    // Enable/disable prev/next buttons
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    
    // Add event listeners to prev/next buttons
    prevPageBtn.onclick = function() {
        if (currentPage > 1) {
            currentPage--;
            renderSchoolTable();
            renderPagination();
        }
    };
    
    nextPageBtn.onclick = function() {
        if (currentPage < totalPages) {
            currentPage++;
            renderSchoolTable();
            renderPagination();
        }
    };
    
    // Generate page numbers
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = i === currentPage 
            ? 'px-3 py-1 border rounded-md bg-blue-600 text-white' 
            : 'px-3 py-1 border rounded-md bg-white text-gray-700 hover:bg-gray-100';
        pageButton.textContent = i;
        
        // Add click event to change page
        pageButton.addEventListener('click', function() {
            currentPage = i;
            renderSchoolTable();
            renderPagination();
        });
        
        pageNumbersContainer.appendChild(pageButton);
    }
}
