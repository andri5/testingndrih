export const helpContent = {
  smokeTest: {
    en: {
      title: "💨 How to Use Smoke Tests",
      description: "Quick validation of core functionality through automated tests",
      sections: [
        {
          id: "what-is",
          title: "What is a Smoke Test?",
          content: `A Smoke Test is a quick automated test that validates the core functionality of your application. It runs critical business flows to ensure basic features are working correctly. It's called "smoke test" because if there's critical functionality broken, it "smokes" (fails immediately).`,
          tips: [
            "Typically runs in 2-5 minutes",
            "Tests only critical user flows",
            "Perfect for quick validation after deployment",
            "Ideal for CI/CD pipelines"
          ]
        },
        {
          id: "when-to-use",
          title: "When Should You Use Smoke Tests?",
          content: "Use smoke tests in these scenarios:",
          scenarios: [
            "After deploying new code to production",
            "Before running comprehensive test suites",
            "During daily CI/CD pipeline runs",
            "Quick validation after system restart",
            "Testing critical user journeys"
          ]
        },
        {
          id: "step-by-step",
          title: "Step-by-Step Guide",
          steps: [
            {
              number: 1,
              title: "Navigate to Smoke Test",
              description: "Click 'Test Asap' in the left sidebar menu under 'Tools' section"
            },
            {
              number: 2,
              title: "View Available Scenarios",
              description: "You'll see a list of pre-configured smoke test scenarios. Each scenario represents a critical user flow (e.g., Login → Create Scenario → Execute Test)"
            },
            {
              number: 3,
              title: "Select a Scenario",
              description: "Click on any scenario to select it. The selected scenario will be highlighted with a light background. You can see the number of test steps in each scenario"
            },
            {
              number: 4,
              title: "Review Scenario Details",
              description: "Once selected, the scenario panel will show detailed information about what will be tested, including the target application URL and test steps"
            },
            {
              number: 5,
              title: "Optional - Enable Notifications",
              description: "Check 'Kirim notifikasi email setelah selesai' if you want to receive an email notification when the test completes"
            },
            {
              number: 6,
              title: "Start Test",
              description: "Click the orange 'Mulai Pengujian Smoke' button to begin the test. The button will show a loading spinner while the test is running"
            },
            {
              number: 7,
              title: "Monitor Progress",
              description: "Watch the test progress in real-time. The interface will show which step is currently executing and the test status"
            },
            {
              number: 8,
              title: "View Results",
              description: "After the test completes, results appear in the right panel showing: passed/failed steps, duration, and timestamp. Green indicates PASSED, red indicates FAILED"
            },
            {
              number: 9,
              title: "Run All Tests (Optional)",
              description: "Click 'Jalankan Semua Pengujian Smoke' at the bottom to run all smoke tests sequentially"
            }
          ]
        },
        {
          id: "understanding-results",
          title: "Understanding Test Results",
          content: "After running a smoke test, you'll see results in the 'Tes Terbaru' (Recent Tests) panel:",
          results: [
            {
              label: "Status Badge",
              description: "Shows BERHASIL (PASSED) in green or GAGAL (FAILED) in red"
            },
            {
              label: "Steps Passed",
              description: "Shows 'X/Y steps' - how many steps passed out of total steps"
            },
            {
              label: "Duration",
              description: "Total time the test took to complete in seconds"
            },
            {
              label: "Timestamp",
              description: "When the test was executed"
            }
          ]
        },
        {
          id: "best-practices",
          title: "Best Practices for Smoke Tests",
          practices: [
            "Run smoke tests after every deployment",
            "Keep smoke test scenarios simple and fast",
            "Test only the most critical user flows",
            "Run them regularly in your CI/CD pipeline",
            "Monitor test history to catch regressions early",
            "Update scenarios when critical flows change",
            "Set up email notifications for failed tests"
          ]
        },
        {
          id: "troubleshooting",
          title: "Troubleshooting Failed Tests",
          issues: [
            {
              problem: "Test keeps failing",
              solution: "Check if the target application is running and accessible. Verify the application URL in scenario details."
            },
            {
              problem: "Test timeout errors",
              solution: "The application might be slow. Increase the execution timeout in Settings > Pengaturan Eksekusi"
            },
            {
              problem: "Test runs but steps fail",
              solution: "The application UI might have changed. Click the scenario to view steps and verify selectors are correct"
            },
            {
              problem: "Email notifications not received",
              solution: "Verify email is configured in the backend. Notifications are only sent if email service is properly set up"
            }
          ]
        }
      ]
    },
    id: {
      title: "💨 Cara Menggunakan Smoke Tests",
      description: "Validasi cepat fungsionalitas inti melalui pengujian otomatis",
      sections: [
        {
          id: "what-is",
          title: "Apa itu Smoke Test?",
          content: `Smoke Test adalah pengujian otomatis cepat yang memvalidasi fungsionalitas inti aplikasi Anda. Ini menjalankan alur bisnis kritis untuk memastikan fitur dasar berfungsi dengan baik. Disebut "smoke test" karena jika ada fungsionalitas kritis yang rusak, itu akan "berbau asap" (gagal langsung).`,
          tips: [
            "Biasanya berjalan dalam 2-5 menit",
            "Hanya menguji alur pengguna kritis",
            "Sempurna untuk validasi cepat setelah deployment",
            "Ideal untuk pipeline CI/CD"
          ]
        },
        {
          id: "when-to-use",
          title: "Kapan Menggunakan Smoke Tests?",
          content: "Gunakan smoke tests dalam skenario ini:",
          scenarios: [
            "Setelah men-deploy kode baru ke produksi",
            "Sebelum menjalankan test suite yang komprehensif",
            "Selama daily pipeline CI/CD",
            "Validasi cepat setelah restart sistem",
            "Menguji alur pengguna kritis"
          ]
        },
        {
          id: "step-by-step",
          title: "Panduan Langkah demi Langkah",
          steps: [
            {
              number: 1,
              title: "Navigasi ke Smoke Test",
              description: "Klik 'Test Asap' di menu sidebar kiri di bawah bagian 'Alat'"
            },
            {
              number: 2,
              title: "Lihat Scenario Tersedia",
              description: "Anda akan melihat daftar scenario smoke test yang sudah dikonfigurasi. Setiap scenario mewakili alur pengguna kritis (misalnya, Login → Buat Scenario → Jalankan Test)"
            },
            {
              number: 3,
              title: "Pilih Scenario",
              description: "Klik pada scenario mana pun untuk memilihnya. Scenario yang dipilih akan disorot dengan latar belakang terang. Anda dapat melihat jumlah langkah test di setiap scenario"
            },
            {
              number: 4,
              title: "Tinjau Detail Scenario",
              description: "Setelah dipilih, panel scenario akan menampilkan informasi detail tentang apa yang akan diuji, termasuk URL aplikasi target dan langkah test"
            },
            {
              number: 5,
              title: "Opsional - Aktifkan Notifikasi",
              description: "Centang 'Kirim notifikasi email setelah selesai' jika ingin menerima notifikasi email ketika test selesai"
            },
            {
              number: 6,
              title: "Mulai Test",
              description: "Klik tombol oranye 'Mulai Pengujian Smoke' untuk memulai test. Tombol akan menampilkan spinner loading saat test sedang berjalan"
            },
            {
              number: 7,
              title: "Pantau Progres",
              description: "Tonton progres test secara real-time. Interface akan menampilkan langkah mana yang sedang dieksekusi dan status test"
            },
            {
              number: 8,
              title: "Lihat Hasil",
              description: "Setelah test selesai, hasil muncul di panel kanan menampilkan: langkah passed/failed, durasi, dan timestamp. Hijau menunjukkan BERHASIL, merah menunjukkan GAGAL"
            },
            {
              number: 9,
              title: "Jalankan Semua Tests (Opsional)",
              description: "Klik 'Jalankan Semua Pengujian Smoke' di bawah untuk menjalankan semua smoke tests secara berurutan"
            }
          ]
        },
        {
          id: "understanding-results",
          title: "Memahami Hasil Test",
          content: "Setelah menjalankan smoke test, Anda akan melihat hasil di panel 'Tes Terbaru' (Recent Tests):",
          results: [
            {
              label: "Status Badge",
              description: "Menampilkan BERHASIL (PASSED) dalam warna hijau atau GAGAL (FAILED) dalam warna merah"
            },
            {
              label: "Steps Passed",
              description: "Menampilkan 'X/Y steps' - berapa banyak langkah yang passed dari total langkah"
            },
            {
              label: "Duration",
              description: "Total waktu test berjalan dalam detik"
            },
            {
              label: "Timestamp",
              description: "Kapan test dijalankan"
            }
          ]
        },
        {
          id: "best-practices",
          title: "Best Practices untuk Smoke Tests",
          practices: [
            "Jalankan smoke tests setelah setiap deployment",
            "Buat scenario smoke test sederhana dan cepat",
            "Hanya uji alur pengguna yang paling kritis",
            "Jalankan secara teratur dalam pipeline CI/CD Anda",
            "Pantau history test untuk menangkap regresi lebih awal",
            "Perbarui scenario ketika alur kritis berubah",
            "Atur notifikasi email untuk test yang gagal"
          ]
        },
        {
          id: "troubleshooting",
          title: "Troubleshooting Test yang Gagal",
          issues: [
            {
              problem: "Test terus gagal",
              solution: "Periksa apakah aplikasi target sedang berjalan dan dapat diakses. Verifikasi URL aplikasi di detail scenario."
            },
            {
              problem: "Error timeout test",
              solution: "Aplikasi mungkin lambat. Tingkatkan timeout eksekusi di Pengaturan > Pengaturan Eksekusi"
            },
            {
              problem: "Test berjalan tapi langkah gagal",
              solution: "UI aplikasi mungkin telah berubah. Klik scenario untuk melihat langkah dan verifikasi selector sudah benar"
            },
            {
              problem: "Notifikasi email tidak diterima",
              solution: "Verifikasi email dikonfigurasi di backend. Notifikasi hanya dikirim jika layanan email sudah diatur dengan benar"
            }
          ]
        }
      ]
    }
  },
  stressTest: {
    en: {
      title: "⚡ How to Use Stress Tests",
      description: "Load and performance testing under high concurrent traffic",
      sections: [
        {
          id: "what-is",
          title: "What is a Stress Test?",
          content: `A Stress Test evaluates how your application performs under high load and concurrent users. It simulates many users accessing your application simultaneously to identify performance bottlenecks, maximum capacity, and stability limits.`,
          tips: [
            "Tests with hundreds to thousands of concurrent requests",
            "Measures response time and error rates",
            "Identifies breaking points and capacity limits",
            "Essential before major releases or traffic spikes"
          ]
        },
        {
          id: "when-to-use",
          title: "When Should You Use Stress Tests?",
          content: "Use stress tests in these scenarios:",
          scenarios: [
            "Before major marketing campaigns or product launches",
            "When expecting significant traffic increases",
            "To establish baseline performance metrics",
            "After major infrastructure changes",
            "To validate auto-scaling configurations",
            "Weekly performance monitoring"
          ]
        },
        {
          id: "step-by-step",
          title: "Step-by-Step Guide",
          steps: [
            {
              number: 1,
              title: "Navigate to Stress Test",
              description: "Click 'Test Beban' in the left sidebar under 'Tools' section"
            },
            {
              number: 2,
              title: "Select a Stress Test Scenario",
              description: "Choose from available scenarios. Each scenario has different load profiles - Light, Medium, Heavy, and Custom"
            },
            {
              number: 3,
              title: "Choose Test Profile",
              description: "Available profiles:\n• Light: 10 concurrent users, 5 iterations (quick test, ~1 min)\n• Medium: 50 concurrent users, 10 iterations (moderate test, ~5 min)\n• Heavy: 100 concurrent users, 20 iterations (intensive test, ~10 min)\n• Custom: Define your own load parameters"
            },
            {
              number: 4,
              title: "For Custom Profile",
              description: "If you selected Custom, enter: Concurrency (number of simultaneous users) and Iterations (repetitions per user)"
            },
            {
              number: 5,
              title: "Review Target Details",
              description: "Verify the target application URL and test endpoints are correct before starting"
            },
            {
              number: 6,
              title: "Start Stress Test",
              description: "Click the purple 'Jalankan Test Beban' button to begin. This may take several minutes depending on the profile"
            },
            {
              number: 7,
              title: "Monitor Live Metrics",
              description: "Watch real-time metrics:\n• Current load (users/requests)\n• Response times (min/max/avg)\n• Error rate percentage\n• Current phase (ramp-up/steady/cool-down)"
            },
            {
              number: 8,
              title: "View Final Report",
              description: "After completion, review:\n• Total requests executed\n• Success/failure counts\n• Average response time\n• Peak response time\n• Error breakdown"
            },
            {
              number: 9,
              title: "Analyze Results",
              description: "Check if response times are acceptable and error rate is low. Compare with previous runs to identify regressions"
            }
          ]
        },
        {
          id: "understanding-results",
          title: "Understanding Stress Test Results",
          content: "Key metrics explained:",
          results: [
            {
              label: "Load",
              description: "Shows as 'X × Y' meaning X concurrent users with Y iterations each"
            },
            {
              label: "Duration",
              description: "Total test execution time (includes ramp-up, steady state, and cool-down)"
            },
            {
              label: "Avg Response Time",
              description: "Average time for all requests. Should be consistent for performance"
            },
            {
              label: "Error Rate",
              description: "Percentage of failed requests. Ideally should be 0% or very low"
            },
            {
              label: "Peak Load",
              description: "Maximum concurrent users reached during the test"
            }
          ]
        },
        {
          id: "best-practices",
          title: "Best Practices for Stress Tests",
          practices: [
            "Start with Light profile and gradually increase load",
            "Run stress tests during off-peak hours",
            "Establish baseline metrics with initial tests",
            "Run tests multiple times for consistency",
            "Monitor system resources (CPU, memory, disk) during testing",
            "Identify when performance degrades significantly",
            "Document capacity limits and share with team",
            "Test critical paths and high-traffic endpoints",
            "Run tests in isolated environment before production",
            "Use results to optimize infrastructure"
          ]
        },
        {
          id: "troubleshooting",
          title: "Troubleshooting Stress Tests",
          issues: [
            {
              problem: "Test fails immediately",
              solution: "Check target application is running and accessible. Verify endpoints are correct."
            },
            {
              problem: "High error rates",
              solution: "Application may be overloaded. Try Light profile first, then gradually increase load. Check server logs."
            },
            {
              problem: "Inconsistent results",
              solution: "Run multiple tests to get average results. External factors may affect results. Try isolating test environment."
            },
            {
              problem: "Test timeout",
              solution: "Reduce load parameters or increase timeout in settings. Very heavy loads may take longer to complete."
            }
          ]
        }
      ]
    },
    id: {
      title: "⚡ Cara Menggunakan Stress Tests",
      description: "Pengujian beban dan performa di bawah traffic concurrency tinggi",
      sections: [
        {
          id: "what-is",
          title: "Apa itu Stress Test?",
          content: `Stress Test mengevaluasi performa aplikasi Anda di bawah beban tinggi dan pengguna concurrent. Ini mensimulasikan banyak pengguna mengakses aplikasi Anda secara bersamaan untuk mengidentifikasi bottleneck performa, kapasitas maksimal, dan batas stabilitas.`,
          tips: [
            "Menguji dengan ratusan hingga ribuan concurrent requests",
            "Mengukur response time dan error rates",
            "Mengidentifikasi breaking points dan batas kapasitas",
            "Penting sebelum major releases atau traffic spikes"
          ]
        },
        {
          id: "when-to-use",
          title: "Kapan Menggunakan Stress Tests?",
          content: "Gunakan stress tests dalam skenario ini:",
          scenarios: [
            "Sebelum campaign marketing besar atau product launch",
            "Ketika mengharapkan peningkatan traffic signifikan",
            "Untuk membuat baseline performance metrics",
            "Setelah major infrastructure changes",
            "Untuk validasi auto-scaling configurations",
            "Weekly performance monitoring"
          ]
        },
        {
          id: "step-by-step",
          title: "Panduan Langkah demi Langkah",
          steps: [
            {
              number: 1,
              title: "Navigasi ke Stress Test",
              description: "Klik 'Test Beban' di sidebar kiri di bawah bagian 'Alat'"
            },
            {
              number: 2,
              title: "Pilih Scenario Stress Test",
              description: "Pilih dari scenario yang tersedia. Setiap scenario memiliki load profile berbeda - Light, Medium, Heavy, dan Custom"
            },
            {
              number: 3,
              title: "Pilih Test Profile",
              description: "Profile yang tersedia:\n• Light: 10 pengguna concurrent, 5 iterations (test cepat, ~1 menit)\n• Medium: 50 pengguna concurrent, 10 iterations (test moderat, ~5 menit)\n• Heavy: 100 pengguna concurrent, 20 iterations (test intensive, ~10 menit)\n• Custom: Tentukan parameter beban Anda sendiri"
            },
            {
              number: 4,
              title: "Untuk Custom Profile",
              description: "Jika memilih Custom, masukkan: Concurrency (jumlah pengguna simultan) dan Iterations (pengulangan per pengguna)"
            },
            {
              number: 5,
              title: "Tinjau Detail Target",
              description: "Verifikasi URL aplikasi target dan endpoint test sudah benar sebelum memulai"
            },
            {
              number: 6,
              title: "Mulai Stress Test",
              description: "Klik tombol ungu 'Jalankan Test Beban' untuk memulai. Ini mungkin memakan beberapa menit tergantung profile"
            },
            {
              number: 7,
              title: "Pantau Live Metrics",
              description: "Tonton metrics real-time:\n• Current load (pengguna/requests)\n• Response times (min/max/avg)\n• Error rate percentage\n• Current phase (ramp-up/steady/cool-down)"
            },
            {
              number: 8,
              title: "Lihat Final Report",
              description: "Setelah selesai, tinjau:\n• Total requests yang dieksekusi\n• Success/failure counts\n• Average response time\n• Peak response time\n• Error breakdown"
            },
            {
              number: 9,
              title: "Analisis Hasil",
              description: "Periksa apakah response times dapat diterima dan error rate rendah. Bandingkan dengan run sebelumnya untuk mengidentifikasi regressi"
            }
          ]
        },
        {
          id: "understanding-results",
          title: "Memahami Hasil Stress Test",
          content: "Penjelasan metric kunci:",
          results: [
            {
              label: "Load",
              description: "Ditampilkan sebagai 'X × Y' yang berarti X pengguna concurrent dengan Y iterations masing-masing"
            },
            {
              label: "Duration",
              description: "Total waktu eksekusi test (termasuk ramp-up, steady state, dan cool-down)"
            },
            {
              label: "Avg Response Time",
              description: "Waktu rata-rata untuk semua requests. Harus konsisten untuk performa baik"
            },
            {
              label: "Error Rate",
              description: "Persentase requests yang gagal. Idealnya 0% atau sangat rendah"
            },
            {
              label: "Peak Load",
              description: "Maksimal pengguna concurrent yang dicapai selama test"
            }
          ]
        },
        {
          id: "best-practices",
          title: "Best Practices untuk Stress Tests",
          practices: [
            "Mulai dengan profile Light dan secara bertahap tingkatkan load",
            "Jalankan stress tests saat jam-jam off-peak",
            "Tentukan baseline metrics dengan test awal",
            "Jalankan tests berkali-kali untuk konsistensi",
            "Monitor system resources (CPU, memory, disk) saat testing",
            "Identifikasi saat performa mulai menurun signifikan",
            "Dokumentasikan capacity limits dan bagikan dengan tim",
            "Test critical paths dan high-traffic endpoints",
            "Jalankan tests di isolated environment sebelum production",
            "Gunakan hasil untuk optimize infrastructure"
          ]
        },
        {
          id: "troubleshooting",
          title: "Troubleshooting Stress Tests",
          issues: [
            {
              problem: "Test gagal langsung",
              solution: "Periksa aplikasi target sedang berjalan dan dapat diakses. Verifikasi endpoints sudah benar."
            },
            {
              problem: "Error rates tinggi",
              solution: "Aplikasi mungkin overload. Coba Light profile lebih dulu, lalu tingkatkan load secara bertahap. Periksa server logs."
            },
            {
              problem: "Hasil tidak konsisten",
              solution: "Jalankan multiple tests untuk hasil rata-rata. Faktor eksternal mungkin mempengaruhi. Coba isolasi test environment."
            },
            {
              problem: "Test timeout",
              solution: "Kurangi load parameters atau tingkatkan timeout di settings. Heavy loads mungkin perlu waktu lebih lama untuk complete."
            }
          ]
        }
      ]
    }
  },
  securityTest: {
    en: {
      title: "🔒 How to Use Security Tests",
      description: "Identify vulnerabilities and security risks in your application",
      sections: [
        {
          id: "what-is",
          title: "What is a Security Test?",
          content: `A Security Test scans your application for common vulnerabilities and security risks. It performs various security checks including SQL injection, XSS (Cross-Site Scripting), CSRF attacks, and other OWASP Top 10 vulnerabilities to ensure your application is secure.`,
          tips: [
            "Identifies common web vulnerabilities",
            "Follows OWASP Top 10 standards",
            "Generates detailed vulnerability reports",
            "Essential before production deployment",
            "Regular security scanning recommended"
          ]
        },
        {
          id: "when-to-use",
          title: "When Should You Use Security Tests?",
          content: "Use security tests in these scenarios:",
          scenarios: [
            "Before any production deployment",
            "After implementing new features",
            "When using third-party libraries or dependencies",
            "Before security audits",
            "Monthly or quarterly security scanning",
            "When vulnerability patterns are discovered",
            "Before major releases"
          ]
        },
        {
          id: "step-by-step",
          title: "Step-by-Step Guide",
          steps: [
            {
              number: 1,
              title: "Navigate to Security Test",
              description: "Click 'Test Keamanan' in the left sidebar under 'Tools' section"
            },
            {
              number: 2,
              title: "Select Target Application",
              description: "Choose the application scenario to scan. Enter or verify the target application URL (e.g., http://localhost:3000)"
            },
            {
              number: 3,
              title: "Choose Scan Type",
              description: "Three scan options available:\n• Pemindaian Lengkap: Complete scan of all endpoints (thorough, takes longer)\n• Pemindaian Cepat: Quick scan of critical endpoints (faster, focuses on common issues)\n• Kustom: Select specific scan modules to run"
            },
            {
              number: 4,
              title: "For Custom Scan",
              description: "Select which vulnerability types to check:\n• SQL Injection\n• Cross-Site Scripting (XSS)\n• CSRF Attacks\n• Authentication Bypass\n• Insecure Direct Object References\n• And more..."
            },
            {
              number: 5,
              title: "Review Scan Settings",
              description: "Verify application URL, scan depth, and timeout settings are appropriate for your application"
            },
            {
              number: 6,
              title: "Start Security Scan",
              description: "Click the red 'Mulai Pemindaian Keamanan' button to begin. This may take several minutes depending on scan type"
            },
            {
              number: 7,
              title: "Monitor Scan Progress",
              description: "Watch the scan progress. The interface shows current endpoint being scanned and percentage completion"
            },
            {
              number: 8,
              title: "Review Vulnerabilities Found",
              description: "After completion, view vulnerability list organized by severity:\n• Kritis (Critical): Highest priority\n• Tinggi (High): Important to fix\n• Sedang (Medium): Should be addressed\n• Rendah (Low): Minor issues"
            },
            {
              number: 9,
              title: "Analyze Each Vulnerability",
              description: "For each finding, understand:\n• Vulnerability type\n• Affected endpoint\n• Severity level\n• Recommended fix"
            },
            {
              number: 10,
              title: "Export Report",
              description: "Download scan results as PDF, HTML, Excel, or JSON for sharing with security team or documentation"
            }
          ]
        },
        {
          id: "understanding-results",
          title: "Understanding Security Test Results",
          content: "Security scan produces detailed vulnerability report:",
          results: [
            {
              label: "Critical Vulnerabilities",
              description: "Issues that pose immediate security risk and must be fixed urgently"
            },
            {
              label: "High Risk Issues",
              description: "Significant security concerns that should be addressed soon"
            },
            {
              label: "Medium Risk Issues",
              description: "Moderate security concerns that should be fixed in next update"
            },
            {
              label: "Low Risk Issues",
              description: "Minor issues with minimal security impact"
            },
            {
              label: "Risk Score",
              description: "Overall security score (0-100). Higher score = more secure"
            }
          ]
        },
        {
          id: "vulnerability-types",
          title: "Common Vulnerabilities Detected",
          vulnerabilities: [
            {
              name: "SQL Injection",
              description: "When user input is directly used in SQL queries without proper sanitization",
              fix: "Use parameterized queries and prepared statements"
            },
            {
              name: "Cross-Site Scripting (XSS)",
              description: "When malicious scripts can be injected into web pages",
              fix: "Properly escape and sanitize all user input before rendering"
            },
            {
              name: "CSRF (Cross-Site Request Forgery)",
              description: "When an attacker tricks users into unwanted actions",
              fix: "Implement CSRF tokens and validate requests"
            },
            {
              name: "Insecure Authentication",
              description: "Weak password policies, missing 2FA, session vulnerabilities",
              fix: "Implement strong authentication, 2FA, and secure session management"
            },
            {
              name: "Sensitive Data Exposure",
              description: "Exposing secrets, API keys, or sensitive information",
              fix: "Use environment variables, never commit secrets, implement encryption"
            }
          ]
        },
        {
          id: "best-practices",
          title: "Best Practices for Security Testing",
          practices: [
            "Run security tests before every production deployment",
            "Fix Critical and High severity issues immediately",
            "Address Medium issues in next sprint/update",
            "Document and track all vulnerabilities",
            "Run regular quarterly security audits",
            "Keep dependencies updated to latest secure versions",
            "Train developers on secure coding practices",
            "Review and fix security issues found in tests",
            "Implement security headers (CSP, HSTS, etc.)",
            "Use security testing in your CI/CD pipeline"
          ]
        },
        {
          id: "troubleshooting",
          title: "Troubleshooting Security Tests",
          issues: [
            {
              problem: "Scan cannot reach application",
              solution: "Verify application is running and accessible. Check firewall rules. Verify URL is correct in target settings."
            },
            {
              problem: "False positives in results",
              solution: "Some vulnerabilities may be false positives. Review each finding carefully. Implement custom bypass rules if needed."
            },
            {
              problem: "Scan takes too long",
              solution: "Use 'Pemindaian Cepat' instead of 'Pemindaian Lengkap'. Reduce scan depth in custom settings."
            },
            {
              problem: "Cannot fix some vulnerabilities",
              solution: "Some issues may require architectural changes. Consult security team. Consider risk vs. effort tradeoff."
            }
          ]
        }
      ]
    },
    id: {
      title: "🔒 Cara Menggunakan Security Tests",
      description: "Identifikasi kerentanan dan risiko keamanan di aplikasi Anda",
      sections: [
        {
          id: "what-is",
          title: "Apa itu Security Test?",
          content: `Security Test memindai aplikasi Anda untuk mencari kerentanan umum dan risiko keamanan. Ini melakukan berbagai pemeriksaan keamanan termasuk SQL injection, XSS (Cross-Site Scripting), CSRF attacks, dan kerentanan OWASP Top 10 lainnya untuk memastikan aplikasi Anda aman.`,
          tips: [
            "Mengidentifikasi kerentanan web umum",
            "Mengikuti standar OWASP Top 10",
            "Menghasilkan laporan kerentanan detail",
            "Penting sebelum deployment production",
            "Security scanning regular direkomendasikan"
          ]
        },
        {
          id: "when-to-use",
          title: "Kapan Menggunakan Security Tests?",
          content: "Gunakan security tests dalam skenario ini:",
          scenarios: [
            "Sebelum deployment production apapun",
            "Setelah mengimplementasikan fitur baru",
            "Ketika menggunakan third-party libraries atau dependencies",
            "Sebelum security audits",
            "Monthly atau quarterly security scanning",
            "Ketika vulnerability patterns ditemukan",
            "Sebelum major releases"
          ]
        },
        {
          id: "step-by-step",
          title: "Panduan Langkah demi Langkah",
          steps: [
            {
              number: 1,
              title: "Navigasi ke Security Test",
              description: "Klik 'Test Keamanan' di sidebar kiri di bawah bagian 'Alat'"
            },
            {
              number: 2,
              title: "Pilih Target Aplikasi",
              description: "Pilih scenario aplikasi untuk dipindai. Masukkan atau verifikasi URL aplikasi target (misalnya, http://localhost:3000)"
            },
            {
              number: 3,
              title: "Pilih Jenis Pemindaian",
              description: "Tiga opsi pemindaian tersedia:\n• Pemindaian Lengkap: Scan lengkap semua endpoints (thorough, butuh waktu lebih lama)\n• Pemindaian Cepat: Quick scan critical endpoints (lebih cepat, fokus common issues)\n• Kustom: Pilih scan modules spesifik untuk dijalankan"
            },
            {
              number: 4,
              title: "Untuk Custom Scan",
              description: "Pilih jenis kerentanan mana yang akan dicek:\n• SQL Injection\n• Cross-Site Scripting (XSS)\n• CSRF Attacks\n• Authentication Bypass\n• Insecure Direct Object References\n• Dan lainnya..."
            },
            {
              number: 5,
              title: "Tinjau Pengaturan Scan",
              description: "Verifikasi URL aplikasi, scan depth, dan timeout settings sudah sesuai untuk aplikasi Anda"
            },
            {
              number: 6,
              title: "Mulai Security Scan",
              description: "Klik tombol merah 'Mulai Pemindaian Keamanan' untuk memulai. Ini mungkin memakan beberapa menit tergantung jenis scan"
            },
            {
              number: 7,
              title: "Pantau Scan Progress",
              description: "Tonton progres scan. Interface menampilkan endpoint yang sedang dipindai dan persentase completion"
            },
            {
              number: 8,
              title: "Tinjau Kerentanan yang Ditemukan",
              description: "Setelah completion, lihat daftar kerentanan diorganisir berdasarkan severity:\n• Kritis: Prioritas tertinggi\n• Tinggi: Penting untuk diperbaiki\n• Sedang: Harus ditangani\n• Rendah: Isu minor"
            },
            {
              number: 9,
              title: "Analisis Setiap Kerentanan",
              description: "Untuk setiap finding, pahami:\n• Tipe kerentanan\n• Endpoint yang affected\n• Level severity\n• Recommended fix"
            },
            {
              number: 10,
              title: "Export Report",
              description: "Download hasil scan sebagai PDF, HTML, Excel, atau JSON untuk dibagikan ke security team atau dokumentasi"
            }
          ]
        },
        {
          id: "understanding-results",
          title: "Memahami Hasil Security Test",
          content: "Security scan menghasilkan laporan kerentanan detail:",
          results: [
            {
              label: "Critical Vulnerabilities",
              description: "Isu yang menimbulkan immediate security risk dan harus diperbaiki urgently"
            },
            {
              label: "High Risk Issues",
              description: "Kekhawatiran keamanan signifikan yang harus ditangani segera"
            },
            {
              label: "Medium Risk Issues",
              description: "Kekhawatiran keamanan moderat yang harus diperbaiki di next update"
            },
            {
              label: "Low Risk Issues",
              description: "Isu minor dengan minimal security impact"
            },
            {
              label: "Risk Score",
              description: "Overall security score (0-100). Score lebih tinggi = lebih secure"
            }
          ]
        },
        {
          id: "vulnerability-types",
          title: "Kerentanan Umum yang Terdeteksi",
          vulnerabilities: [
            {
              name: "SQL Injection",
              description: "Ketika user input langsung digunakan dalam SQL queries tanpa sanitasi proper",
              fix: "Gunakan parameterized queries dan prepared statements"
            },
            {
              name: "Cross-Site Scripting (XSS)",
              description: "Ketika malicious scripts dapat diinjeksi ke web pages",
              fix: "Properly escape dan sanitasi semua user input sebelum rendering"
            },
            {
              name: "CSRF (Cross-Site Request Forgery)",
              description: "Ketika attacker trik users untuk unwanted actions",
              fix: "Implementasi CSRF tokens dan validasi requests"
            },
            {
              name: "Insecure Authentication",
              description: "Weak password policies, missing 2FA, session vulnerabilities",
              fix: "Implementasi strong authentication, 2FA, dan secure session management"
            },
            {
              name: "Sensitive Data Exposure",
              description: "Mengekspose secrets, API keys, atau informasi sensitif",
              fix: "Gunakan environment variables, jangan commit secrets, implementasi encryption"
            }
          ]
        },
        {
          id: "best-practices",
          title: "Best Practices untuk Security Testing",
          practices: [
            "Jalankan security tests sebelum setiap production deployment",
            "Perbaiki Critical dan High severity issues immediately",
            "Tangani Medium issues di next sprint/update",
            "Dokumentasikan dan track semua kerentanan",
            "Jalankan quarterly security audits regular",
            "Selalu update dependencies ke latest secure versions",
            "Train developers tentang secure coding practices",
            "Review dan fix security issues yang ditemukan",
            "Implementasi security headers (CSP, HSTS, dll)",
            "Gunakan security testing di CI/CD pipeline Anda"
          ]
        },
        {
          id: "troubleshooting",
          title: "Troubleshooting Security Tests",
          issues: [
            {
              problem: "Scan tidak bisa reach aplikasi",
              solution: "Verifikasi aplikasi sedang berjalan dan accessible. Periksa firewall rules. Verifikasi URL benar di target settings."
            },
            {
              problem: "False positives di results",
              solution: "Beberapa kerentanan mungkin false positives. Review setiap finding carefully. Implementasi custom bypass rules jika needed."
            },
            {
              problem: "Scan butuh waktu terlalu lama",
              solution: "Gunakan 'Pemindaian Cepat' instead of 'Pemindaian Lengkap'. Kurangi scan depth di custom settings."
            },
            {
              problem: "Tidak bisa fix beberapa kerentanan",
              solution: "Beberapa isu mungkin require architectural changes. Konsultasi security team. Pertimbangkan risk vs. effort tradeoff."
            }
          ]
        }
      ]
    }
  }
}

export default helpContent
