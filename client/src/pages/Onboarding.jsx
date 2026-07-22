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
          <div style={{ flex: 1, width: '100%' }}>
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
                )
              }
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Objek Stylesheet Vertikal Responsif Modern
const styles = {
  container: {
    background: 'linear-gradient(180deg, #EBF3FF 0%, #F5F9FF 100%)',
    minHeight: '100vh',
    fontFamily: '"Inter", sans-serif',
    color: '#1E293B',
    overflowX: 'hidden',
    width: '100%'
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem clamp(1rem, 4vw, 4rem)',
    backgroundColor: '#1E3A8A', 
    boxShadow: '0 4px 20px rgba(30, 58, 138, 0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    flexWrap: 'wrap',
    gap: '0.75rem'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  logoIcon: {
    width: '38px',
    height: '38px',
    backgroundColor: 'white', 
    color: '#1E3A8A',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '12px',
    fontWeight: '900',
    fontSize: '1.3rem'
  },
  logoText: {
    margin: 0,
    fontWeight: '800',
    fontSize: '1.15rem',
    color: 'white'
  },
  logoSubtext: {
    fontSize: '0.7rem',
    color: '#93C5FD',
    display: 'block',
    marginTop: '-2px'
  },
  menuLinks: {
    display: 'flex',
    gap: 'clamp(1rem, 2vw, 2.5rem)',
    fontWeight: '600',
    fontSize: '0.9rem'
  },
  menuItem: {
    cursor: 'pointer',
    position: 'relative',
    paddingBottom: '0.4rem',
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
    gap: '1rem',
    fontWeight: '600'
  },
  loginLink: {
    color: '#E0F2FE',
    cursor: 'pointer',
    transition: '0.2s',
    fontSize: '0.9rem'
  },
  registerButton: {
    backgroundColor: 'white',
    color: '#1E3A8A',
    padding: '0.5rem 1.2rem',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    boxShadow: '0 4px 10px rgba(255, 255, 255, 0.1)'
  },
  heroWrapper: {
    padding: 'clamp(1rem, 3vw, 4rem)',
    width: '100%',
    boxSizing: 'border-box'
  },
  heroBox: {
    background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
    borderRadius: '28px',
    padding: 'clamp(2rem, 5vw, 6rem) clamp(1.5rem, 4vw, 5rem)',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 30px 60px rgba(30, 58, 138, 0.25)', 
    border: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'relative',
    gap: '2rem',
    boxSizing: 'border-box'
  },
  heroTitle: {
    fontSize: 'clamp(1.8rem, 5vw, 3.75rem)',
    fontWeight: '900',
    color: '#FFFFFF',
    margin: 0,
    letterSpacing: '-0.5px',
    lineHeight: '1.2',
    wordBreak: 'break-word'
  },
  heroSubtitle: {
    fontSize: 'clamp(0.95rem, 2vw, 1.35rem)',
    color: '#93C5FD',
    marginTop: '1.2rem',
    fontWeight: '500',
    lineHeight: '1.6'
  },
  heroButton: {
    backgroundColor: '#10B981', 
    color: 'white',
    padding: '0.85rem 1.8rem',
    border: 'none',
    borderRadius: '14px',
    fontSize: '1rem',
    fontWeight: '700',
    marginTop: '2rem',
    cursor: 'pointer',
    boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.3s ease'
  },
  heroIcon: {
    fontSize: 'clamp(4rem, 10vw, 8rem)',
    filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.3))',
    margin: '0 auto'
  },
  sectionFitur: {
    padding: 'clamp(3rem, 6vw, 7rem) clamp(1rem, 4vw, 4rem)',
    textAlign: 'center',
    background: 'linear-gradient(180deg, #F4F8FF 0%, #E0ECFF 100%)',
    boxSizing: 'border-box'
  },
  sectionTitle: {
    fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: '1rem'
  },
  sectionSubtitle: {
    color: '#4B5563',
    marginBottom: '3rem',
    fontSize: 'clamp(0.9rem, 2vw, 1.05rem)',
    fontWeight: '500'
  },
  gridFitur: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.5rem',
    width: '100%',
    boxSizing: 'border-box'
  },
  cardFitur: {
    backgroundColor: 'white',
    padding: '2.5rem 1.5rem',
    borderRadius: '24px',
    textAlign: 'left',
    boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    boxSizing: 'border-box'
  },
  iconFiturBox: {
    fontSize: '2rem',
    width: '60px',
    height: '60px',
    borderRadius: '16px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '1.25rem'
  },
  cardFiturTitle: {
    margin: 0,
    fontSize: '1.15rem',
    fontWeight: '800',
    color: '#1E293B'
  },
  cardFiturDesc: {
    fontSize: '0.9rem',
    color: '#64748B',
    marginTop: '0.75rem',
    lineHeight: '1.6'
  },
  sectionTentang: {
    padding: 'clamp(4rem, 8vw, 8rem) clamp(1rem, 4vw, 4rem)',
    background: 'linear-gradient(180deg, #1E3A8A 0%, #0F172A 100%)',
    boxSizing: 'border-box'
  },
  cardTentang: {
    maxWidth: '950px',
    margin: '0 auto',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)', 
    backdropFilter: 'blur(12px)',
    padding: 'clamp(2rem, 5vw, 5rem) clamp(1.2rem, 4vw, 4rem)',
    borderRadius: '32px',
    boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxSizing: 'border-box'
  },
  tentangIcon: {
    fontSize: '3rem',
    marginBottom: '1rem'
  },
  sectionTentangTitle: {
    fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
    fontWeight: '800',
    color: 'white',
    marginBottom: '1.5rem'
  },
  tentangText: {
    fontSize: 'clamp(0.95rem, 2vw, 1.2rem)',
    color: '#E2E8F0',
    lineHeight: '1.8',
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
    zIndex: 999,
    padding: '1rem',
    boxSizing: 'border-box'
  },
  modalBox: {
    backgroundColor: 'white',
    padding: '2rem 1.5rem',
    borderRadius: '28px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    boxSizing: 'border-box'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#1E3A8A'
  },
  modalClose: {
    cursor: 'pointer',
    fontSize: '1.2rem',
    color: '#9CA3AF'
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  inputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem'
  },
  inputLabel: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#4B5563'
  },
  modalInput: {
    width: '100%',
    padding: '0.8rem 1rem',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
    fontSize: '0.9rem',
    boxSizing: 'border-box'
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#2563EB',
    color: 'white',
    padding: '0.85rem',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer'
  },
  modalSwitchText: {
    textAlign: 'center',
    fontSize: '0.85rem'
  }
};

export default Onboarding;