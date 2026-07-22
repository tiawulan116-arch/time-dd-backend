import { useState, useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

const Onboarding = ({ onNavigateToDashboard }) => {
  const [authModal, setAuthModal] = useState({ isOpen: false, type: 'masuk' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [activeMenu, setActiveMenu] = useState('beranda');

  // API URL DISESUAIKAN KE MOCKAPI ONLINE
  const API_URL = 'https://6a60fe94da10c59c180952e3.mockapi.io/users';

  useEffect(() => {
    AOS.init({ 
      duration: 1000, 
      once: false, 
      mirror: true 
    });

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      const fiturSection = document.getElementById('fitur-section');
      const tentangSection = document.getElementById('tentang-section');

      if (tentangSection && scrollPosition >= tentangSection.offsetTop) {
        setActiveMenu('tentang');
      } else if (fiturSection && scrollPosition >= fiturSection.offsetTop) {
        setActiveMenu('fitur');
      } else {
        setActiveMenu('beranda');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // INTEGRASI API UTAMA KE MOCKAPI
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return alert("Silakan isi semua kolom data!");

    const targetEmail = email.trim().toLowerCase();
    const targetPassword = password.trim();

    try {
      // 1. Ambil list database users dari MockAPI
      const resUsers = await fetch(API_URL);
      let savedUsers = [];
      if (resUsers.ok) {
        savedUsers = await resUsers.json();
      }

      if (authModal.type === 'daftar') {
        // Cek apakah email sudah terdaftar di MockAPI
        const isExist = savedUsers.some(user => user.email && user.email.toLowerCase() === targetEmail);
        if (isExist) {
          return alert("⚠️ Pendaftaran Gagal! Email ini sudah terdaftar.");
        }

        const newUser = { 
          name: name.trim(), 
          email: targetEmail, 
          password: targetPassword 
        };

        // POST data user baru ke MockAPI
        const regRes = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser)
        });

        if (regRes.ok) {
          alert("✨ Pendaftaran Berhasil! Data tersimpan online. Silakan masuk menggunakan akun baru kamu.");
          setAuthModal({ isOpen: true, type: 'masuk' });
          setName(''); setEmail(''); setPassword('');
        }
      } else {
        // Logika mencocokkan akun dari MockAPI
        const matchedUser = savedUsers.find(
          (user) => user.email && user.email.toLowerCase() === targetEmail && user.password === targetPassword
        );

        if (matchedUser) {
          // Simpan data user aktif ke LocalStorage untuk sesi login
          localStorage.setItem('currentUser', JSON.stringify(matchedUser));
          
          setAuthModal({ isOpen: false, type: 'masuk' });
          setEmail(''); setPassword('');
          onNavigateToDashboard();
        } else {
          alert("❌ Akses Ditolak! Akun belum terdaftar atau password salah.");
        }
      }
    } catch (error) {
      console.error("Kesalahan koneksi API:", error);
      alert("❌ Gagal terhubung ke Database Online! Periksa koneksi internet Anda.");
    }
  };

  const scrollToSection = (id, menuName) => {
    setActiveMenu(menuName);
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
    else if (id === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={styles.container}>
      
      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <div style={styles.logoContainer}>
          <div style={styles.logoIcon}>T</div>
          <div>
            <h4 style={styles.logoText}>TimeDD</h4>
            <span style={styles.logoSubtext}>Double Degree Balance</span>
          </div>
        </div>

        <div style={styles.menuLinks}>
          {[
            { key: 'beranda', label: 'Beranda', target: 'top' },
            { key: 'fitur', label: 'Fitur', target: 'fitur-section' },
            { key: 'tentang', label: 'Tentang', target: 'tentang-section' }
          ].map((item) => (
            <span 
              key={item.key} 
              onClick={() => scrollToSection(item.target, item.key)} 
              style={{
                ...styles.menuItem,
                color: activeMenu === item.key ? '#FFFFFF' : '#93C5FD'
              }}
            >
              {item.label}
              <span style={{
                ...styles.lineIndicator,
                width: activeMenu === item.key ? '100%' : '0%'
              }} />
            </span>
          ))}
        </div>

        <div style={styles.authNav}>
          <span onClick={() => setAuthModal({ isOpen: true, type: 'masuk' })} style={styles.loginLink}>Masuk</span>
          <button onClick={() => setAuthModal({ isOpen: true, type: 'daftar' })} style={styles.registerButton}>Daftar</button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header style={styles.heroWrapper}>
        <div style={styles.heroBox} data-aos="zoom-in-up" data-aos-duration="1200">
          <div>
            <h1 style={styles.heroTitle} data-aos="fade-right" data-aos-delay="200">Welcome to TimeDD</h1>
            <p style={styles.heroSubtitle} data-aos="fade-right" data-aos-delay="400">Let's balance your academic tracks easily and efficiently today.</p>
            <button 
              onClick={() => setAuthModal({ isOpen: true, type: 'daftar' })} 
              style={styles.heroButton}
              data-aos="fade-up"
              data-aos-delay="600"
            >
              Mulai Sekarang →
            </button>
          </div>
          <div style={styles.heroIcon} data-aos="zoom-in" data-aos-delay="500">📁</div>
        </div>
      </header>

      {/* SECTION FITUR */}
      <section id="fitur-section" style={styles.sectionFitur}>
        <h2 style={styles.sectionTitle} data-aos="fade-down">Kenapa Harus Menggunakan TimeDD?</h2>
        <p style={styles.sectionSubtitle} data-aos="fade-down" data-aos-delay="100">Solusi tepat pengelolaan waktu perkuliahan, pekerjaan, dan organisasi dalam satu genggaman praktis.</p>
        
        <div style={styles.gridFitur}>
          {[
            { icon: '✔️', title: 'Manajemen Praktis', desc: 'Simpan, ubah, dan hapus tugas perkuliahan maupun kerja shift secara langsung.', color: '#3B82F6', bg: '#EFF6FF', anim: 'fade-right' },
            { icon: '⏰', title: 'Anti Bentrok', desc: 'Sistem pintar yang mendeteksi tabrakan waktu antar-agenda secara real-time.', color: '#EF4444', bg: '#FEF2F2', anim: 'fade-up' },
            { icon: '📅', title: 'Kalender Terintegrasi', desc: 'Pantau timeline bulanan tugas akademik dengan visual pemetaan yang jernih.', color: '#10B981', bg: '#ECFDF5' , anim: 'fade-down'},
            { icon: '📊', title: 'Ringkasan Dinamis', desc: 'Grafik kalkulasi cepat untuk memantau sisa tugas tertunda dan tugas selesai.', color: '#A855F7', bg: '#FDF4FF', anim: 'fade-left' }
          ].map((item, index) => (
            <div 
              key={index} 
              style={{ ...styles.cardFitur, borderTop: `6px solid ${item.color}` }} 
              data-aos={item.anim}
              data-aos-delay={index * 100}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-12px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 20px 35px rgba(30, 58, 138, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.02)';
              }}
            >
              <div style={{ ...styles.iconFiturBox, backgroundColor: item.bg }}>{item.icon}</div>
              <h4 style={styles.cardFiturTitle}>{item.title}</h4>
              <p style={styles.cardFiturDesc}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION TENTANG */}
      <section id="tentang-section" style={styles.sectionTentang}>
        <div style={styles.cardTentang} data-aos="zoom-in-up">
          <div style={styles.tentangIcon} data-aos="zoom-in" data-aos-delay="200">💡</div>
          <h2 style={styles.sectionTentangTitle}>Tentang Aplikasi TimeDD</h2>
          <p style={styles.tentangText}>
            <strong>TimeDD</strong> adalah solusi manajemen waktu yang dirancang khusus untuk membantu mahasiswa Double Degree maupun mahasiswa yang bekerja sambil kuliah. Melalui pengelolaan jadwal yang terintegrasi, aplikasi ini membantu menyeimbangkan jadwal perkuliahan, penyelesaian tugas, dan jam kerja sehingga setiap aktivitas dapat berjalan lebih efektif, terorganisir, dan tanpa bentrokan jadwal.
          </p>
        </div>
      </section>

      {/* POP-UP MODAL AUTH */}
      {authModal.isOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox} data-aos="zoom-in" data-aos-duration="250">
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{authModal.type === 'masuk' ? 'Selamat Datang Kembali 👋' : 'Buat Akun Baru ✨'}</h3>
              <span onClick={() => setAuthModal({ isOpen: false, type: 'masuk' })} style={styles.modalClose}>❌</span>
            </div>
            <form onSubmit={handleAuthSubmit} style={styles.modalForm}>
              {authModal.type === 'daftar' && (
                <div style={styles.inputWrapper}>
                  <label style={styles.inputLabel}>Nama Lengkap</label>
                  <input type="text" placeholder="Nama Lengkap Kamu" value={name} onChange={(e) => setName(e.target.value)} required style={styles.modalInput} />
                </div>
              )}
              <div style={styles.inputWrapper}>
                <label style={styles.inputLabel}>Alamat Email</label>
                <input type="email" placeholder="Alamat Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.modalInput} />
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.inputLabel}>Kata Sandi / Password</label>
                <input type="password" placeholder="Kata Sandi / Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.modalInput} />
              </div>
              <button type="submit" style={styles.modalButton}>{authModal.type === 'masuk' ? 'Masuk Sekarang' : 'Daftar Akun'}</button>
              <div style={styles.modalSwitchText}>
                {authModal.type === 'masuk' ? (
                  <span>Belum punya akun? <strong onClick={() => setAuthModal({ isOpen: true, type: 'daftar' })} style={{ color: '#2563EB', cursor: 'pointer' }}>Daftar di sini</strong></span>
                ) : (
                  <span>Sudah memiliki akun? <strong onClick={() => setAuthModal({ isOpen: true, type: 'masuk' })} style={{ color: '#2563EB', cursor: 'pointer' }}>Masuk di sini</strong></span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Objek Stylesheet Vertikal Rapi
const styles = {
  container: {
    background: 'linear-gradient(180deg, #EBF3FF 0%, #F5F9FF 100%)',
    minHeight: '100vh',
    fontFamily: '"Inter", sans-serif',
    color: '#1E293B',
    overflowX: 'hidden'
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 4rem',
    backgroundColor: '#1E3A8A', 
    boxShadow: '0 4px 20px rgba(30, 58, 138, 0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    backgroundColor: 'white', 
    color: '#1E3A8A',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '12px',
    fontWeight: '900',
    fontSize: '1.4rem'
  },
  logoText: {
    margin: 0,
    fontWeight: '800',
    fontSize: '1.2rem',
    color: 'white'
  },
  logoSubtext: {
    fontSize: '0.75rem',
    color: '#93C5FD',
    display: 'block',
    marginTop: '-2px'
  },
  menuLinks: {
    display: 'flex',
    gap: '2.5rem',
    fontWeight: '600',
    fontSize: '0.95rem'
  },
  menuItem: {
    cursor: 'pointer',
    position: 'relative',
    paddingBottom: '0.5rem',
    transition: '0.3s'
  },
  lineIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '3px',
    backgroundColor: 'white',
    transition: '0.3s'
  },
  authNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    fontWeight: '600'
  },
  loginLink: {
    color: '#E0F2FE',
    cursor: 'pointer',
    transition: '0.2s'
  },
  registerButton: {
    backgroundColor: 'white',
    color: '#1E3A8A',
    padding: '0.65rem 1.5rem',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    boxShadow: '0 4px 10px rgba(255, 255, 255, 0.1)'
  },
  heroWrapper: {
    padding: '4rem'
  },
  heroBox: {
    background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
    borderRadius: '36px',
    padding: '6rem 5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 30px 60px rgba(30, 58, 138, 0.25)', 
    border: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'relative'
  },
  heroTitle: {
    fontSize: '3.75rem',
    fontWeight: '900',
    color: '#FFFFFF',
    margin: 0,
    letterSpacing: '-1px'
  },
  heroSubtitle: {
    fontSize: '1.35rem',
    color: '#93C5FD',
    marginTop: '1.5rem',
    fontWeight: '500',
    lineHeight: '1.6'
  },
  heroButton: {
    backgroundColor: '#10B981', 
    color: 'white',
    padding: '1rem 2.25rem',
    border: 'none',
    borderRadius: '14px',
    fontSize: '1.05rem',
    fontWeight: '700',
    marginTop: '2.5rem',
    cursor: 'pointer',
    boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.3s ease'
  },
  heroIcon: {
    fontSize: '9rem',
    filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.3))' 
  },
  sectionFitur: {
    padding: '7rem 4rem 6rem 4rem',
    textAlign: 'center',
    background: 'linear-gradient(180deg, #F4F8FF 0%, #E0ECFF 100%)'
  },
  sectionTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: '1rem'
  },
  sectionSubtitle: {
    color: '#4B5563',
    marginBottom: '4.5rem',
    fontSize: '1.05rem',
    fontWeight: '500'
  },
  gridFitur: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '2rem'
  },
  cardFitur: {
    backgroundColor: 'white',
    padding: '3.5rem 2rem',
    borderRadius: '28px',
    textAlign: 'left',
    boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  iconFiturBox: {
    fontSize: '2.5rem',
    width: '70px',
    height: '70px',
    borderRadius: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '1.75rem'
  },
  cardFiturTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#1E293B'
  },
  cardFiturDesc: {
    fontSize: '0.95rem',
    color: '#64748B',
    marginTop: '0.85rem',
    lineHeight: '1.7'
  },
  sectionTentang: {
    padding: '8rem 4rem 10rem 4rem',
    background: 'linear-gradient(180deg, #1E3A8A 0%, #0F172A 100%)'
  },
  cardTentang: {
    maxWidth: '950px',
    margin: '0 auto',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)', 
    backdropFilter: 'blur(12px)',
    padding: '5rem 4rem',
    borderRadius: '40px',
    boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  tentangIcon: {
    fontSize: '3.5rem',
    marginBottom: '1.5rem'
  },
  sectionTentangTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: 'white',
    marginBottom: '2rem'
  },
  tentangText: {
    fontSize: '1.2rem',
    color: '#E2E8F0',
    lineHeight: '1.9',
    fontWeight: '500'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999
  },
  modalBox: {
    backgroundColor: 'white',
    padding: '2.75rem 2.5rem',
    borderRadius: '32px',
    width: '420px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#1E3A8A'
  },
  modalClose: {
    cursor: 'pointer',
    fontSize: '1.3rem',
    color: '#9CA3AF'
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem'
  },
  inputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem'
  },
  inputLabel: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#4B5563'
  },
  modalInput: {
    width: '100%',
    padding: '0.85rem 1.1rem',
    borderRadius: '14px',
    border: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
    fontSize: '0.95rem'
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#2563EB',
    color: 'white',
    padding: '1rem',
    border: 'none',
    borderRadius: '14px',
    fontWeight: '700',
    fontSize: '1rem',
    cursor: 'pointer'
  },
  modalSwitchText: {
    textAlign: 'center',
    fontSize: '0.875rem'
  }
};

export default Onboarding;