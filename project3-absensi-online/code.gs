const SHEET_ID = '1dZh3Zb3LEx3a7uD6Nd685hYhd5QP7kPmEsw39Mf6XFI';

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Absensi Online')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(file) {
  return HtmlService.createHtmlOutputFromFile(file).getContent();
}

/* ================= LOGIN ================= */
function login(nim) {
  try {
    console.log('Login attempt for NIM:', nim);
    
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName('data_mahasiswa');
    
    if (!sheet) {
      console.error('Sheet data_mahasiswa not found');
      return { 
        status: 'error', 
        message: 'Sheet data tidak ditemukan' 
      };
    }
    
    const data = sheet.getDataRange().getValues();
    console.log('Total data rows:', data.length);
    
    // Cek dari baris 2 (indeks 1) karena baris 1 adalah header
    for (let i = 1; i < data.length; i++) {
      const nimFromSheet = data[i][0];
      if (nimFromSheet) {
        const nimStr = nimFromSheet.toString().trim();
        console.log(`Checking row ${i}: "${nimStr}" vs "${nim.trim()}"`);
        
        if (nimStr === nim.trim()) {
          console.log('Login successful for NIM:', nim);
          return { 
            status: 'success', 
            nim: nim.trim(),
            message: 'Login berhasil'
          };
        }
      }
    }
    
    console.log('NIM not found:', nim);
    return { 
      status: 'error', 
      message: 'NIM "' + nim + '" tidak ditemukan. Pastikan NIM benar.' 
    };
    
  } catch (error) {
    console.error('Login error:', error);
    return { 
      status: 'error', 
      message: 'Terjadi kesalahan sistem. Silakan coba lagi.' 
    };
  }
}

/* ================= ABSENSI ================= */
function submitAbsensi(data) {
  try {
    console.log('Submitting absensi:', data);
    
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName('data_absensi');
    
    if (!sheet) {
      return { 
        status: 'error', 
        message: 'Sheet absensi tidak ditemukan' 
      };
    }
    
    // Format tanggal Indonesia
    const now = new Date();
    const timeZone = Session.getScriptTimeZone();
    const formattedDate = Utilities.formatDate(now, timeZone, 'dd/MM/yyyy HH:mm:ss');
    
    // Tambahkan data ke sheet
    sheet.appendRow([
      formattedDate,
      data.nim,
      data.makul,
      data.status
    ]);
    
    console.log('Absensi saved successfully');
    return { 
      status: 'success', 
      message: 'Absensi berhasil disimpan pada ' + formattedDate 
    };
    
  } catch (error) {
    console.error('Submit absensi error:', error);
    return { 
      status: 'error', 
      message: 'Gagal menyimpan absensi. Silakan coba lagi.' 
    };
  }
}

/* ================= LOAD DATA ================= */
function getAbsensiList() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const absensiSheet = ss.getSheetByName('data_absensi');
    const mahasiswaSheet = ss.getSheetByName('data_mahasiswa');
    
    if (!absensiSheet || !mahasiswaSheet) {
      return [];
    }
    
    // Ambil data
    const absensiData = absensiSheet.getDataRange().getValues();
    const mahasiswaData = mahasiswaSheet.getDataRange().getValues();
    
    // Buat mapping NIM -> data mahasiswa
    const mahasiswaMap = {};
    for (let i = 1; i < mahasiswaData.length; i++) {
      const nim = mahasiswaData[i][0];
      if (nim) {
        const nimKey = nim.toString().trim();
        mahasiswaMap[nimKey] = {
          nama: mahasiswaData[i][1] || 'Tidak diketahui',
          prodi: mahasiswaData[i][2] || '-'
        };
      }
    }
    
    // Proses data absensi (mulai dari baris 2)
    const result = [];
    for (let i = 1; i < absensiData.length; i++) {
      const nim = absensiData[i][1];
      if (nim) {
        const nimKey = nim.toString().trim();
        if (mahasiswaMap[nimKey]) {
          result.push({
            nama: mahasiswaMap[nimKey].nama,
            nim: nimKey,
            prodi: mahasiswaMap[nimKey].prodi,
            jam: absensiData[i][0] || '-',
            makul: absensiData[i][2] || '-',
            status: absensiData[i][3] || '-'
          });
        }
      }
    }
    
    // Urutkan berdasarkan waktu terbaru
    result.sort((a, b) => {
      try {
        // Coba parse tanggal Indonesia (dd/MM/yyyy HH:mm:ss)
        const dateA = a.jam === '-' ? new Date(0) : 
                     new Date(a.jam.split('/').reverse().join('-').replace(' ', 'T'));
        const dateB = b.jam === '-' ? new Date(0) : 
                     new Date(b.jam.split('/').reverse().join('-').replace(' ', 'T'));
        return dateB - dateA;
      } catch (e) {
        return 0;
      }
    });
    
    console.log('Loaded', result.length, 'absensi records');
    return result;
    
  } catch (error) {
    console.error('Get absensi list error:', error);
    return [];
  }
}

/* ================= DEBUG FUNCTION ================= */
function testLogin() {
  // Fungsi untuk testing di Apps Script console
  const testNIM = '12345678'; // Ganti dengan NIM yang ada di sheet
  console.log('Testing login for NIM:', testNIM);
  const result = login(testNIM);
  console.log('Result:', result);
  return result;
}
