// Global variables
let currentPage = 1;
const itemsPerPage = 10;
let schools = [];
let filteredSchools = [];
window.provinsiData = [];
window.selectedProvinceCode = null;

// DOM Elements
const schoolTable = document.getElementById('schoolTable');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const provinceFilter = document.getElementById('provinceFilter');
const districtFilter = document.getElementById('districtFilter');
const levelFilter = document.getElementById('levelFilter');

// Check if we're on the admin page
const isAdminPage = window.location.pathname.includes('admin');

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Setup event listeners first
        setupEventListeners();
        
        // Load provinces for filter and form
        await loadProvinces();
        
        // Load schools data
        await loadSchools();
        
        // Render the table with initial data
        renderSchoolTable();
        
        // Initialize pagination
        renderPagination();
    } catch (error) {
        console.error('Error initializing page:', error);
        showAlert('Gagal memuat data. Silakan refresh halaman.', 'error');
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
        provinceFilter.addEventListener('change', async function() {
            const provinceCode = this.value;
            window.selectedProvinceCode = provinceCode;
            
            // Reset district filter
            if (districtFilter) {
                districtFilter.innerHTML = '<option value="">Semua Kabupaten/Kota</option>';
                districtFilter.disabled = !provinceCode;
            }
            
            // Load districts if province is selected
            if (provinceCode) {
                await loadDistricts(provinceCode);
            }
            
            // Filter schools
            currentPage = 1;
            filterSchools();
            renderSchoolTable();
            renderPagination();
        });
    }
    
    // District filter
    if (districtFilter) {
        districtFilter.addEventListener('change', function() {
            currentPage = 1;
            filterSchools();
            renderSchoolTable();
            renderPagination();
        });
    }
    
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
    try {
        const response = await fetch('/api/provinsi');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const provinces = await response.json();
        window.provinsiData = provinces;
        
        // Sort provinces alphabetically
        provinces.sort((a, b) => a.nama.localeCompare(b.nama));
        
        // Add options to filter dropdown
        if (provinceFilter) {
            // Reset and add default option
            provinceFilter.innerHTML = '<option value="">Semua Provinsi</option>';
            
            // Add options to select
            provinces.forEach(province => {
                const option = document.createElement('option');
                option.value = province.kode;
                option.textContent = province.nama;
                provinceFilter.appendChild(option);
            });
        }
        
        // Add options to form dropdown
        const formProvinceSelect = document.getElementById('provinsi');
        if (formProvinceSelect) {
            // Reset and add default option
            formProvinceSelect.innerHTML = '<option value="">Pilih Provinsi</option>';
            
            // Add options to select
            provinces.forEach(province => {
                const option = document.createElement('option');
                option.value = province.kode;
                option.textContent = province.nama;
                formProvinceSelect.appendChild(option);
            });
            
            // Add change event listener to load districts when province changes
            formProvinceSelect.addEventListener('change', async function() {
                const provinceCode = this.value;
                if (provinceCode) {
                    const kabupatenSelect = document.getElementById('kabupaten');
                    if (kabupatenSelect) {
                        kabupatenSelect.innerHTML = '<option value="">Memuat data...</option>';
                        kabupatenSelect.disabled = true;
                        
                        try {
                            const response = await fetch(`/api/kabupaten?provinsi=${provinceCode}`);
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            
                            const districts = await response.json();
                            
                            // Sort districts alphabetically
                            districts.sort((a, b) => a.nama.localeCompare(b.nama));
                            
                            // Reset and add options
                            kabupatenSelect.innerHTML = '<option value="">Pilih Kabupaten/Kota</option>';
                            
                            districts.forEach(district => {
                                const option = document.createElement('option');
                                option.value = district.kode;
                                option.textContent = district.nama;
                                kabupatenSelect.appendChild(option);
                            });
                            
                            kabupatenSelect.disabled = false;
                        } catch (error) {
                            console.error('Error loading districts:', error);
                            kabupatenSelect.innerHTML = '<option value="">Error loading data</option>';
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading provinces:', error);
        showAlert('Gagal memuat data provinsi', 'error');
    }
}

// Load districts for selected province
async function loadDistricts(provinceCode) {
    try {
        const response = await fetch(`/api/kabupaten?provinsi=${provinceCode}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const districts = await response.json();
        
        if (districtFilter) {
            // Sort districts alphabetically
            districts.sort((a, b) => a.nama.localeCompare(b.nama));
            
            // Reset and add options
            districtFilter.innerHTML = '<option value="">Semua Kabupaten/Kota</option>';
            
            districts.forEach(district => {
                const option = document.createElement('option');
                option.value = district.kode;
                option.textContent = district.nama;
                districtFilter.appendChild(option);
            });
            
            districtFilter.disabled = false;
        }
    } catch (error) {
        console.error('Error loading districts:', error);
        showAlert('Gagal memuat data kabupaten/kota', 'error');
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
    const districtCode = districtFilter ? districtFilter.value : '';
    const level = levelFilter ? levelFilter.value : '';
    
    filteredSchools = schools.filter(school => {
        // Search term filter
        const matchesSearch = !searchTerm || 
            (school.nama && school.nama.toLowerCase().includes(searchTerm)) || 
            (school.alamat && school.alamat.toLowerCase().includes(searchTerm)) ||
            (school.npsn && school.npsn.toLowerCase().includes(searchTerm));
        
        // Province filter
        const matchesProvince = !provinceCode || school.kode_provinsi === provinceCode;
        
        // District filter
        const matchesDistrict = !districtCode || school.kode_kabupaten === districtCode;
        
        // Level filter
        const matchesLevel = !level || (school.jenjang && school.jenjang.toLowerCase() === level.toLowerCase());
        
        return matchesSearch && matchesProvince && matchesDistrict && matchesLevel;
    });
    
    console.log(`Filtered to ${filteredSchools.length} schools`);
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
            <td colspan="6" class="px-6 py-4 text-center text-gray-500">
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

// Edit school function - loads school data and opens the edit form
async function editSchool(schoolId) {
    try {
        // Show loading state
        document.getElementById('modalTitle').textContent = 'Memuat Data Sekolah...';
        
        // Open the modal first to show loading state
        openModal();
        
        // Fetch school data from API
        const response = await fetch(`/api/sekolah/${schoolId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const school = await response.json();
        console.log('School data loaded:', school);
        
        // Update form title
        document.getElementById('modalTitle').textContent = 'Edit Data Sekolah';
        
        // Set form fields with school data
        document.getElementById('sekolahId').value = school.id;
        document.getElementById('nama').value = school.nama || '';
        document.getElementById('npsn').value = school.npsn || '';
        document.getElementById('alamat').value = school.alamat || '';
        
        // Set jenjang (school level)
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
            
            // Trigger province change to load districts
            if (provinsiValue) {
                await loadDistricts(provinsiValue);
                
                // Set kabupaten (district) after districts are loaded
                const kabupatenSelect = document.getElementById('kabupaten');
                if (kabupatenSelect) {
                    const kabupatenValue = school.kode_kabupaten || '';
                    setTimeout(() => {
                        for (let i = 0; i < kabupatenSelect.options.length; i++) {
                            if (kabupatenSelect.options[i].value === kabupatenValue) {
                                kabupatenSelect.selectedIndex = i;
                                break;
                            }
                        }
                    }, 500); // Small delay to ensure districts are loaded
                }
            }
        }
        
        // Set coordinates
        document.getElementById('latitude').value = school.latitude || '';
        document.getElementById('longitude').value = school.longitude || '';
        
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
        const kode_kabupaten = document.getElementById('kabupaten').value;
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
            kode_kabupaten: kode_kabupaten || null,
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
            document.getElementById('sekolahId').value = '';
            document.getElementById('modalTitle').textContent = 'Tambah Sekolah Baru';
        }
    }
}

// Render pagination
function renderPagination() {
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
