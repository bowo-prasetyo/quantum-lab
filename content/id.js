// Bahasa Indonesia: the lessons, Quantum Concepts and Help, translated from
// content/en.js (same structure). Terms follow docs/glossary-id.md. Each
// lesson's options keep the English order: lessons.js stores the right
// answer as an index. {placeholders} name buttons and views and are filled
// in from locales/id.js, so they always match the interface.

export default {
  parts: {
    '1': 'Satu qubit',
    '2': 'Dua qubit',
    '3': 'Tiga qubit',
    '4': 'Algoritma kuantum'
  },
  lessons: {
    'bit-flip': {
      title: 'Membalik bit',
      goal: 'Lihat bagaimana gerbang X membalik sebuah qubit, seperti NOT klasik.',
      why: 'Komputer kuantum tetap bisa menjalankan logika biasa. X adalah versi kuantum dari NOT.',
      steps: [
        'Tekan X pada qubit 0.',
        'Tekan {measureAll}.'
      ],
      question: 'Qubit dimulai sebagai |0⟩. Setelah X, apa yang akan ditunjukkan {measureAll}?',
      options: [
        'Selalu |0⟩',
        'Selalu |1⟩',
        '|0⟩ atau |1⟩, 50/50'
      ],
      result: 'X mengubah |0⟩ menjadi |1⟩, jadi hasil pengukurannya selalu |1⟩. Vektor Bloch berpindah dari kutub utara ke kutub selatan.'
    },
    superposition: {
      title: 'Superposisi',
      goal: 'Gunakan gerbang H untuk menempatkan qubit dalam superposisi seimbang dari |0⟩ dan |1⟩.',
      why: 'Superposisi adalah titik awal hampir setiap algoritma kuantum.',
      steps: [
        'Tekan H pada qubit 0.',
        'Perhatikan probabilitas dan bola Bloch.',
        'Di tampilan {shotsView}, tekan {run100} beberapa kali.'
      ],
      question: 'Setelah H, berapa peluang mengukur |0⟩ dan |1⟩?',
      options: [
        '100% |0⟩',
        '100% |1⟩',
        'Masing-masing 50%'
      ],
      result: 'H memberi kedua amplitudo nilai 0,707, jadi setiap hasil memiliki probabilitas 0,707² = 50%. Vektor Bloch kini menunjuk ke arah +x, di ekuator. Setiap shot memberi 0 atau 1 secara acak, jadi 100 shot memberi kira-kira 50 untuk masing-masing, dan tidak pernah persis sama dua kali.'
    },
    collapse: {
      title: 'Keruntuhan akibat pengukuran',
      goal: 'Lihat bahwa mengukur sebuah qubit mengubah keadaannya.',
      why: 'Dalam mekanika kuantum, mengamati bukanlah tindakan pasif. Pengukuran memaksa munculnya jawaban yang pasti.',
      steps: [
        'Qubit dimulai dalam superposisi (50/50).',
        'Tekan {measureAll}.',
        'Tekan {measureAll} lagi.'
      ],
      question: 'Setelah pengukuran pertama, apa yang akan ditunjukkan pengukuran kedua?',
      options: [
        'Hasil acak yang baru',
        'Selalu sama dengan yang pertama',
        'Selalu |0⟩'
      ],
      result: 'Pengukuran pertama meruntuhkan superposisi ke hasil yang diberikannya. Keadaannya kini pasti |0⟩ atau |1⟩, jadi pengukuran kedua selalu sama dengan yang pertama.'
    },
    reversibility: {
      title: 'Keterbalikan',
      goal: 'Lihat bahwa menerapkan H dua kali membatalkannya.',
      why: 'Gerbang kuantum dapat dibalik. Tidak ada informasi yang hilang sampai Anda mengukur.',
      steps: [
        'Tekan H pada qubit 0.',
        'Tekan H pada qubit 0 lagi.'
      ],
      question: 'Setelah H dua kali, apa yang akan ditunjukkan {measureAll}?',
      options: [
        'Selalu |0⟩',
        'Selalu |1⟩',
        '|0⟩ atau |1⟩, 50/50'
      ],
      result: 'H yang kedua membatalkan yang pertama, mengembalikan qubit ke |0⟩. Jadi meskipun satu H memberi superposisi 50/50, dua gerbang H selalu memberi |0⟩.'
    },
    'hidden-phase': {
      title: 'Fase yang tidak terlihat',
      goal: 'Lihat bahwa gerbang Z mengubah fase tanpa mengubah probabilitas.',
      why: 'Amplitudo memiliki fase selain besarnya. Fase tidak terlihat oleh satu pengukuran, tetapi berpengaruh di kemudian hari.',
      steps: [
        'Tekan H pada qubit 0.',
        'Tekan Z pada qubit 0.',
        'Bandingkan probabilitas dan tabel amplitudo.'
      ],
      question: 'Z diterapkan setelah H. Apa yang terjadi pada probabilitas 50/50?',
      options: [
        'Tetap 50/50',
        'Menjadi 100% |1⟩',
        'Menjadi 100% |0⟩'
      ],
      result: 'Z membalik tanda amplitudo |1⟩ (fase 180°). Probabilitas adalah kuadrat besar amplitudo, jadi tetap 50/50, tetapi vektor Bloch berputar dari +x ke −x.'
    },
    interference: {
      title: 'Fase yang terlihat: interferensi',
      goal: 'Lihat fase menjadi terlihat ketika amplitudo bergabung.',
      why: 'Interferensi adalah cara algoritma kuantum membuat jawaban yang salah saling meniadakan dan jawaban yang benar saling menguatkan.',
      steps: [
        'Tekan H pada qubit 0.',
        'Tekan Z pada qubit 0.',
        'Tekan H pada qubit 0.',
        'Perhatikan tampilan {interferenceView}: tampilan ini menunjukkan dua lintasan menuju setiap hasil dari H terakhir.'
      ],
      question: 'H lalu H memberi |0⟩. Apa yang diberikan H, Z, H?',
      options: [
        'Selalu |0⟩',
        'Selalu |1⟩',
        '50/50'
      ],
      result: 'H terakhir menggabungkan kedua amplitudo. Tanpa Z, lintasan menuju |1⟩ saling meniadakan dan Anda mendapat |0⟩. Z membalik satu tanda, sehingga kini lintasan menuju |0⟩-lah yang saling meniadakan, dan hasilnya selalu |1⟩. Fase yang tidak terlihat itulah yang menentukan hasilnya. Tampilan Interferensi menggambarkannya: dua panah menuju |0⟩ berlawanan arah dan saling meniadakan, dua panah menuju |1⟩ searah dan saling menjumlahkan.'
    },
    'complex-phase': {
      title: 'Fase kompleks: S, T, dan Y',
      goal: 'Lihat bahwa fase bisa bernilai sudut berapa pun, bukan hanya pembalikan tanda.',
      why: 'Amplitudo adalah bilangan kompleks. S (90°) dan T (45°) mengatur fase yang lebih halus, yang diandalkan oleh algoritma.',
      steps: [
        'Tekan H pada qubit 0.',
        'Tekan S pada qubit 0.',
        'Perhatikan kolom fase dan bola Bloch.'
      ],
      question: 'Setelah H, vektor Bloch menunjuk ke arah +x. Ke mana arahnya setelah S?',
      options: [
        '+y',
        '−x',
        'Kutub utara'
      ],
      result: 'S memberi |1⟩ fase 90° (amplitudo 0,707i), memutar vektor Bloch seperempat putaran mengelilingi sumbu z, dari +x ke +y. Probabilitasnya tetap 50/50. Coba juga T (45°) atau Y.'
    },
    'bloch-sphere': {
      title: 'Membaca bola Bloch',
      goal: 'Hubungkan bola Bloch dengan keadaan: ketinggian adalah probabilitas, sudut keliling adalah fase.',
      why: 'Bola Bloch menunjukkan seluruh keadaan sebuah qubit dalam satu gambar, dan dipakai di sepanjang sisa jalur ini.',
      steps: [
        'Tekan H pada qubit 0.',
        'Tekan T pada qubit 0.',
        'Baca nilai x, y, dan z di bawah bola.'
      ],
      question: 'T adalah fase 45°. Berawal dari +x, di mana vektor berakhir?',
      options: [
        '45° mengelilingi ekuator, di antara +x dan +y',
        'Di kutub selatan',
        'Tetap di +x'
      ],
      result: 'Gerbang fase memutar vektor mengelilingi sumbu z, jadi ketinggiannya (z = 0, pembagian 50/50) tetap sama dan ia bergerak 45° mengelilingi ekuator: x = y = 0,71. Utara adalah |0⟩, selatan adalah |1⟩, ekuator adalah 50/50, dan sudut kelilingnya adalah fase.'
    },
    'two-qubits': {
      title: 'Dua qubit yang saling bebas',
      goal: 'Lihat bagaimana dua qubit memberi empat keadaan basis.',
      why: 'Setiap qubit tambahan menggandakan jumlah keadaan basis. Pertumbuhan yang cepat itu adalah salah satu alasan komputer kuantum dapat melakukan hal yang sulit bagi komputer klasik.',
      steps: [
        'Tekan H pada qubit 0.',
        'Tekan H pada qubit 1.'
      ],
      question: 'Kedua qubit mendapat H. Apa yang dapat ditunjukkan {measureAll}?',
      options: [
        'Hanya |00⟩ atau |11⟩',
        'Salah satu dari |00⟩, |01⟩, |10⟩, |11⟩, masing-masing 25%',
        'Selalu |00⟩'
      ],
      result: 'Setiap qubit 50/50 dengan sendirinya dan keduanya saling bebas, jadi keempat kombinasi sama mungkinnya: masing-masing 25%. Kedua vektor Bloch tetap berada di permukaan.'
    },
    cnot: {
      title: 'Controlled NOT',
      goal: 'Lihat bagaimana satu qubit dapat mengendalikan qubit lain.',
      why: 'Gerbang terkendali membuat qubit dapat berinteraksi. Gerbang ini adalah blok penyusun keterbelitan.',
      steps: [
        'Tekan X pada qubit 0.',
        'Tekan CNOT (kontrol Q0, target Q1).'
      ],
      question: 'Qubit 0 bernilai |1⟩. Apa yang diberikan CNOT?',
      options: [
        '|10⟩',
        '|11⟩',
        '|01⟩'
      ],
      result: 'CNOT membalik target hanya jika kontrolnya bernilai 1. Qubit 0 bernilai 1, jadi qubit 1 terbalik: |10⟩ menjadi |11⟩. Coba CNOT tanpa X: |00⟩ tetap |00⟩.'
    },
    'bell-pair': {
      title: 'Pasangan Bell',
      goal: 'Ciptakan keterbelitan dengan H dan CNOT.',
      why: 'Qubit yang terbelit berperilaku sebagai satu sistem. Inilah sumber daya di balik teleportasi kuantum dan banyak algoritma.',
      steps: [
        'Tekan H pada qubit 0.',
        'Tekan CNOT (kontrol Q0, target Q1).',
        'Tekan {measureAll} dan catat hasilnya. Lalu tekan {setUp}, ulangi kedua langkah, dan ulangi beberapa kali lagi.'
      ],
      question: 'Hasil apa saja yang dapat ditunjukkan {measureAll}?',
      options: [
        'Salah satu dari keempatnya, masing-masing 25%',
        'Hanya |00⟩ atau |11⟩, masing-masing 50%',
        'Hanya |01⟩ atau |10⟩'
      ],
      result: 'Keadaannya adalah (|00⟩ + |11⟩)/√2. Setiap qubit secara terpisah acak, tetapi keduanya selalu sama: |01⟩ dan |10⟩ tidak pernah muncul. Tombol {bell} membangun keadaan ini dalam satu langkah.'
    },
    'entangled-bloch': {
      title: 'Keterbelitan pada bola Bloch',
      goal: 'Lihat bagaimana keterbelitan tampak pada bola Bloch setiap qubit.',
      why: 'Bola Bloch adalah penanda keterbelitan di lab ini.',
      steps: [
        'Tekan {bell}.',
        'Perhatikan kedua bola Bloch.'
      ],
      question: 'Pada pasangan Bell, ke mana arah vektor Bloch?',
      options: [
        'Keduanya ke arah +x',
        'Keduanya di kutub utara',
        'Tidak ke mana pun: keduanya menyusut ke pusat'
      ],
      result: 'Setiap qubit secara terpisah tidak memiliki arah yang pasti: ia berada dalam keadaan campuran (secara terpisah, ia berperilaku seperti lemparan koin tanpa fase yang berarti), jadi vektornya memiliki panjang 0. Keadaan dua qubit secara keseluruhan tetap terdefinisi sempurna. Vektor yang lebih pendek dari 1 berarti qubit itu terbelit dengan qubit lainnya.'
    },
    'measure-one-qubit': {
      title: 'Mengukur satu qubit dari pasangan Bell',
      goal: 'Ukur hanya satu qubit dari pasangan yang terbelit, dan lihat qubit lainnya merespons.',
      why: 'Mengukur sebagian sistem adalah cara komputer kuantum membaca hasil, dan cara kerja protokol seperti teleportasi.',
      steps: [
        'Penyiapan telah membuat pasangan Bell: (|00⟩ + |11⟩)/√2. Kedua vektor Bloch berada di pusat.',
        'Tekan M pada qubit 0 untuk mengukur qubit itu saja.',
        'Perhatikan kedua bola Bloch, probabilitas, dan bit klasik.'
      ],
      question: 'Anda hanya mengukur qubit 0. Apa yang terjadi pada qubit 1?',
      options: [
        'Tidak ada: ia masih dalam superposisi',
        'Kini nilainya sama dengan qubit 0',
        'Selalu menjadi 0'
      ],
      result: 'Qubit 0 memberi 0 atau 1 secara acak, dan pasangan itu runtuh ke |00⟩ atau |11⟩, jadi qubit 1 kini pasti bernilai sama. Kedua vektor Bloch melompat dari pusat ke kutub yang sama. Mengukur satu qubit dari keadaan produk akan membiarkan qubit lainnya tak tersentuh; di sini keterbelitanlah yang menghubungkan keduanya. (Tidak ada pesan yang dapat dikirim dengan cara ini: hasil qubit 0 acak.)'
    },
    'correlation-vs-entanglement': {
      title: 'Korelasi bukan keterbelitan',
      goal: 'Pelajari apa yang diukur graf korelasi, dan mengapa itu bukan keterbelitan.',
      why: 'Hasil yang sama bisa berasal dari keterbelitan atau dari kesesuaian klasik biasa. Membedakan keduanya adalah keterampilan penting.',
      steps: [
        'Setelah penyiapan, keadaannya adalah |00⟩. Perhatikan graf korelasi dan bola Bloch.',
        'Lalu tekan {bell} dan bandingkan.',
        'Perhatikan juga tampilan {entanglementView} dan {pauliView} untuk kedua keadaan.'
      ],
      question: 'Keadaannya adalah |00⟩. Apa yang ditunjukkan graf korelasi?',
      options: [
        '0,00: bit-bitnya sama dan berbeda sama seringnya',
        '1,00: bit-bitnya selalu sama',
        'Tidak ada: tidak ada keterbelitan'
      ],
      result: 'Kedua qubit selalu bernilai 0, jadi bit hasil pengukurannya selalu sama: graf menunjukkan 1,00. Namun tidak ada yang terbelit, dan kedua vektor Bloch panjangnya penuh. Pasangan Bell juga menunjukkan 1,00, tetapi vektor Bloch-nya menyusut ke pusat. Hal sebaliknya juga berlaku: pasangan Bell dengan H tambahan pada qubit 1 tetap terbelit penuh, tetapi graf menunjukkan 0,00. Gunakan bola Bloch atau tampilan {entanglementView}, bukan graf korelasi, untuk mengenali keterbelitan: tampilan {entanglementView} menyatakan “Tidak ada keterbelitan” untuk |00⟩ dan “terbelit maksimal” untuk kedua pasangan Bell. Tampilan {pauliView} menunjukkan mengapa graf korelasi tidak cukup: graf itu hanya membaca sel ZZ, sedangkan pasangan Bell berkorelasi di setiap basis (XX = +1, YY = −1, ZZ = +1).'
    },
    ghz: {
      title: 'Keadaan GHZ',
      goal: 'Belitkan ketiga qubit sekaligus.',
      why: 'Keadaan GHZ menunjukkan bahwa keterbelitan dapat menghubungkan lebih dari dua qubit. Keadaan ini dipakai dalam koreksi galat kuantum dan penginderaan.',
      steps: [
        'Tekan H pada qubit 0.',
        'Tekan CNOT dengan kontrol Q0, target Q1.',
        'Tekan CNOT dengan kontrol Q1, target Q2.'
      ],
      question: 'Hasil apa saja yang dapat ditunjukkan {measureAll}?',
      options: [
        'Hanya |000⟩ atau |111⟩',
        'Kedelapannya, sama mungkinnya',
        'Hanya |000⟩'
      ],
      result: 'Keadaannya adalah (|000⟩ + |111⟩)/√2: ketiga qubit selalu sama. Ketiga vektor Bloch menyusut ke pusat, karena setiap qubit terbelit dengan dua qubit lainnya. Tombol {ghz} membangunnya dalam satu langkah. Di tampilan {pauliView}, setiap pasangan hanya menunjukkan ZZ = +1, seperti kesesuaian klasik biasa; keterkaitan tiga arah hanya muncul pada nilai tiga qubit, seperti ⟨XXX⟩ = +1.'
    },
    'density-matrix': {
      title: 'Matriks densitas: probabilitas vs koherensi',
      goal: 'Baca matriks densitas: diagonalnya memuat probabilitas, dan kotak di luar diagonal menunjukkan superposisi.',
      why: 'Matriks densitas membedakan superposisi sejati dari campuran acak yang akan memberi probabilitas yang sama.',
      steps: [
        'Tekan {ghz}.',
        'Perhatikan matriks densitas.',
        'Lalu tekan {measureAll} dan perhatikan lagi.'
      ],
      question: 'Untuk keadaan GHZ, berapa banyak kotak yang ditunjukkan matriks densitas?',
      options: [
        '2, di diagonal',
        '4, di sudut-sudut',
        'Semua 64'
      ],
      result: 'Dua kotak diagonal memuat probabilitas |000⟩ dan |111⟩ (masing-masing 0,5). Dua kotak di luar diagonal pada sudut yang berseberangan menghubungkan keduanya: itulah koherensi, tanda superposisi yang sejati. Setelah {measureAll}, hanya satu kotak diagonal yang tersisa.'
    },
    decoherence: {
      title: 'Dekoherensi: bagaimana derau mengakhiri superposisi',
      goal: 'Lihat derau mengubah superposisi GHZ menjadi campuran acak biasa, sementara probabilitasnya tetap sama.',
      why: 'Qubit sungguhan tidak pernah terisolasi sempurna. Derau yang menghancurkan koherensi, yang disebut dekoherensi, adalah hambatan utama dalam membangun komputer kuantum.',
      steps: [
        'Penyiapan telah membuat keadaan GHZ (|000⟩ + |111⟩)/√2. Perhatikan keempat kotak matriks densitas: dua di diagonal, dua di sudut.',
        'Di panel {noisePanel}, pilih {dephasing} dan atur kekuatannya ke 100%.',
        'Tekan {noiseQ0}, lalu perhatikan lagi matriks densitas dan probabilitasnya.'
      ],
      question: 'Dephasing berkekuatan penuh mengenai qubit 0. Apa yang terjadi pada matriks densitas?',
      options: [
        'Tidak ada yang berubah',
        'Dua kotak di sudut menghilang; diagonalnya tetap',
        'Hanya |000⟩ yang tersisa'
      ],
      result: 'Kotak-kotak di sudut, yaitu koherensi antara |000⟩ dan |111⟩, menghilang; diagonalnya tetap 0,5 masing-masing. Probabilitasnya tidak berubah, tetapi keadaannya bukan lagi superposisi: ia adalah campuran acak, seolah-olah sebuah koin sudah memutuskan antara |000⟩ dan |111⟩. Kemurnian di bawah matriks turun dari 1 menjadi 0,5. Derau pada satu qubit saja sudah cukup untuk menghancurkan koherensi ketiganya, itulah sebabnya keadaan terbelit yang besar begitu rapuh.'
    },
    'noise-and-depth': {
      title: 'Derau bertambah di setiap langkah',
      goal: 'Jalankan sirkuit pada perangkat keras berderau yang disimulasikan dan lihat fidelitasnya turun di setiap langkah, bahkan pada langkah yang saling meniadakan.',
      why: 'Setiap gerbang pada perangkat keras sungguhan memakan waktu, dan selama itu qubit mengalami dekoherensi. Hal itu membatasi seberapa panjang sirkuit yang berguna, dan itulah sebabnya koreksi galat kuantum penting.',
      steps: [
        'Penyiapan telah memilih {dephasing} sebesar 3% di panel {noisePanel} dan mencentang Jalankan dengan derau di editor sirkuit: setelah setiap langkah, setiap qubit mendapat sedikit derau.',
        'Bangun sirkuit GHZ: H pada Q0, CNOT Q0→Q1, CNOT Q1→Q2.',
        'Lalu tambahkan H pada Q2 empat kali. Tanpa derau, setiap pasangan gerbang H saling meniadakan, jadi sirkuit tetap membuat keadaan GHZ.',
        'Tekan {run}, lalu baca kurva fidelitas di {timelineView}.'
      ],
      question: 'Keempat gerbang H tambahan saling meniadakan berpasangan. Dengan derau setelah setiap langkah, bagaimana fidelitas akhir dibandingkan dengan fidelitas tepat setelah tiga gerbang GHZ?',
      options: [
        'Sama: gerbang tambahan saling meniadakan',
        'Lebih rendah: setiap langkah menambah derau',
        'Lebih tinggi: gerbang tambahan membatalkan sebagian derau'
      ],
      result: 'Fidelitas turun di setiap langkah: sekitar 0,92 setelah tiga gerbang GHZ, dan sekitar 0,78 setelah empat gerbang tambahan, meskipun gerbang-gerbang itu saling meniadakan dan sirkuit tanpa derau membuat keadaan GHZ yang sama. Deraunya tidak saling meniadakan: ia bertambah seiring jumlah langkah. Pada perangkat keras sungguhan hal ini membatasi kedalaman sirkuit, dan itulah sebabnya koreksi galat kuantum, yang memakai qubit tambahan untuk menangkap galat, diperlukan untuk komputasi yang panjang.'
    },
    'noisy-readout': {
      title: 'Membaca qubit pun berderau',
      goal: 'Lihat galat pembacaan mencatat hasil yang tidak mungkin diberikan keadaan, lalu koreksi setelahnya.',
      why: 'Pada perangkat keras sungguhan, keadaan yang sempurna pun bisa terbaca salah. Mengoreksi galat pembacaan (mitigasi) adalah langkah standar di setiap eksperimen.',
      steps: [
        'Penyiapan telah membuat keadaan GHZ (|000⟩ + |111⟩)/√2 dan menyalakan galat pembacaan di tampilan {shotsView}: setiap 1 terbaca sebagai 0 sebanyak 5% dari waktu, dan setiap 0 sebagai 1 sebanyak 2%.',
        'Tekan {run1000} dan cari hasil selain |000⟩ dan |111⟩.',
        'Centang {mitigate} dan bandingkan batang ungu dengan garisnya.',
        'Tekan {run100} beberapa kali dengan koreksi menyala, dan lihat perkiraannya menyebar.'
      ],
      question: 'Keadaan GHZ hanya dapat memberi |000⟩ atau |111⟩, tetapi galat pembacaan menyala. Apa yang akan dicatat oleh 1000 shot?',
      options: [
        'Hanya |000⟩ dan |111⟩',
        'Sebagian besar |000⟩ dan |111⟩, ditambah beberapa hasil yang tidak mungkin diberikan keadaan',
        'Kedelapan hasil dengan jumlah yang kira-kira sama'
      ],
      result: 'Kira-kira satu dari sepuluh shot mencatat hasil seperti |001⟩ atau |110⟩, yang tidak mungkin diberikan keadaan GHZ: salah satu bitnya salah terbaca. Keadaannya sendiri tidak pernah berubah, seperti yang ditunjukkan tabel; hanya pencatatannya yang berubah. Mengoreksi galat pembacaan menghitung balik jumlahnya melalui laju galat yang diketahui, dan hasil yang mustahil turun ke sekitar 0% sementara |000⟩ dan |111⟩ kembali ke sekitar 50%. Dengan hanya 100 shot, perkiraan yang dikoreksi menyebar, bahkan bisa turun di bawah 0%, karena membatalkan galat juga memperbesar sebaran acak dalam jumlahnya.'
    },
    'reduced-states': {
      title: 'Keadaan tereduksi dan kecampuran',
      goal: 'Lihat bahwa keterbelitan hanya memengaruhi qubit yang terlibat.',
      why: 'Dalam sistem yang lebih besar, Anda perlu tahu qubit mana yang terbelit dengan qubit mana.',
      steps: [
        'Tekan {bell} (ini membelitkan qubit 0 dan 1).',
        'Tekan H pada qubit 2.'
      ],
      question: 'Qubit 0 dan 1 adalah pasangan Bell dan qubit 2 mendapat H. Vektor Bloch mana yang tetap berada di permukaan?',
      options: [
        'Ketiganya',
        'Hanya qubit 2',
        'Tidak ada'
      ],
      result: 'Qubit 0 dan 1 saling terbelit, jadi vektornya menyusut ke pusat (keadaan campuran). Qubit 2 tidak terbelit dengan apa pun: ia adalah superposisi murni, jadi vektornya tetap di permukaan pada +x. Tampilan Keterbelitan menyebutkannya: qubit 0 dan 1 saling terbelit; qubit 2 terpisah. Bandingkan dengan keadaan GHZ, di mana ketiganya terbelit bersama.'
    },
    'phase-cube': {
      title: 'Fase pada kubus 3D',
      goal: 'Lihat perubahan fase pada kubus 3D sementara probabilitasnya tetap sama.',
      why: 'Dengan lebih banyak qubit, pola fase di banyak keadaan basis adalah bahan kerja algoritma seperti Quantum Fourier Transform.',
      steps: [
        'Setelah penyiapan, kedelapan keadaan sama mungkinnya (12,5%).',
        'Tekan Z pada qubit 0.',
        'Perhatikan warna kubus dan kolom fase.'
      ],
      question: 'Apa yang diubah oleh Z pada qubit 0?',
      options: [
        'Probabilitasnya',
        'Fase dari empat keadaan di mana qubit 0 bernilai 1',
        'Tidak ada sama sekali'
      ],
      result: 'Z membalik tanda setiap amplitudo di mana qubit 0 bernilai 1 (|100⟩ sampai |111⟩), jadi keempat sudut itu berubah warna (fase 180°). Semua probabilitas tetap 12,5%, jadi batang dan ukuran titiknya tidak bergerak.'
    },
    'build-circuit': {
      title: 'Bangun sirkuit Anda sendiri',
      goal: 'Gunakan editor sirkuit untuk membangun dan menjalankan serangkaian gerbang.',
      why: 'Program kuantum sungguhan adalah sirkuit: urutan gerbang yang tetap, dijalankan secara berurutan.',
      steps: [
        'Di editor sirkuit, tambahkan H dari baris Q0.',
        'Pilih kontrol Q0 dan target Q1, lalu tambahkan CNOT.',
        'Tetap dengan kontrol Q0, pilih target Q2, lalu tambahkan CNOT.',
        'Tekan {run}.'
      ],
      question: 'Sirkuit ini memakai CNOT q0→q2, bukan q1→q2 seperti di pelajaran GHZ. Keadaan apa yang dibangunnya?',
      options: [
        'Keadaan GHZ yang sama',
        'Pasangan Bell hanya pada qubit 0 dan 1',
        'Campuran seimbang dari kedelapan keadaan'
      ],
      result: 'Kedua sirkuit memberi (|000⟩ + |111⟩)/√2. Qubit 0 mengendalikan kedua CNOT, jadi qubit 1 dan 2 menyalin nilainya, dan ketiganya selalu sama. Sirkuit yang berbeda dapat membangun keadaan yang sama.'
    },
    'deutsch-jozsa': {
      title: 'Deutsch–Jozsa: satu pertanyaan, bukan tiga',
      goal: 'Cari tahu apakah sebuah fungsi tersembunyi konstan atau seimbang dengan memanggilnya hanya sekali.',
      why: 'Algoritma ini memperluas algoritma Deutsch (1985), yang pertama mengalahkan setiap metode klasik deterministik untuk masalahnya. Ia bekerja dengan interferensi, gagasan dari Bagian 1.',
      steps: [
        'Teka-tekinya: sebuah fungsi tersembunyi f menerima dua bit (qubit 0 dan 1) dan mengembalikan satu bit. Fungsi itu konstan (jawaban yang sama untuk setiap masukan) atau seimbang (0 untuk separuh masukan, 1 untuk sisanya). Secara klasik, Anda mungkin perlu 3 panggilan untuk mengetahuinya. Di sini Anda cukup sekali.',
        'Penyiapan telah menempatkan qubit 0 dan 1 dalam superposisi seimbang dari keempat masukan, dan qubit 2 dalam keadaan (|0⟩ − |1⟩)/√2.',
        'Panggil orakel sekali. Orakel ini menghitung f(x) = x₀ XOR x₁: tekan CNOT dengan kontrol Q0, target Q2, lalu CNOT dengan kontrol Q1, target Q2.',
        'Tekan H pada qubit 0 dan H pada qubit 1. Lalu jalankan 100 shot dan perhatikan qubit 0 dan 1: dua digit pertama setiap hasil.'
      ],
      question: 'f ini seimbang. Setelah satu panggilan orakel dan gerbang H terakhir, apa yang akan ditunjukkan qubit 0 dan 1?',
      options: [
        'Selalu 00',
        'Tidak pernah 00',
        'Hasil acak setiap kali'
      ],
      result: 'Qubit 0 dan 1 selalu terbaca 11, tidak pernah 00. Orakel membalik tanda masukan di mana f(x) = 1. Ia melakukannya melalui qubit 2: keadaan khususnya mengubah pembalikan bit oleh orakel menjadi tanda pada masukan (phase kickback), dan gerbang H terakhir mengubah pola fase itu menjadi jawaban yang pasti. f yang konstan selalu memberi 00; f seimbang mana pun tidak pernah. Satu panggilan sudah cukup. Coba tanpa CNOT (f = 0, konstan): Anda mendapat 00.'
    },
    grover: {
      title: 'Pencarian Grover: menemukan item yang ditandai',
      goal: 'Temukan mana dari empat item yang ditandai, dengan satu putaran pencarian Grover.',
      why: 'Algoritma Grover mencari di antara N item dalam sekitar √N langkah, bukan N. Algoritma ini menunjukkan cara memperbesar probabilitas jawaban yang benar.',
      steps: [
        'Penyiapan telah menempatkan kedua qubit dalam superposisi seimbang: masing-masing dari keempat item |00⟩, |01⟩, |10⟩, |11⟩ berpeluang 25%.',
        'Orakel: tandai |11⟩ dengan membalik tandanya. Tekan CZ (kontrol Q0, target Q1). Periksa tabel amplitudo: |11⟩ kini −0,5, tetapi setiap probabilitas masih 25%.',
        'Difusi, bagian 1: tekan H pada kedua qubit, lalu X pada kedua qubit. (Langkah 3 sampai 5 bersama-sama mencerminkan setiap amplitudo terhadap rata-ratanya, yang memperbesar amplitudo yang ditandai.)',
        'Difusi, bagian 2: balik lagi tanda |11⟩: tekan CZ.',
        'Difusi, bagian 3: X pada kedua qubit, lalu H pada kedua qubit.'
      ],
      question: 'Empat item, satu ditandai. Setelah satu putaran pencarian Grover, berapa peluang mengukur item yang ditandai |11⟩?',
      options: [
        '25%, sama dengan menebak',
        '50%',
        '100%'
      ],
      result: 'Orakel hanya mengubah fase item yang ditandai, yang tidak terlihat dalam probabilitas. Difusi lalu mencerminkan setiap amplitudo terhadap rata-ratanya: tiga amplitudo yang tidak ditandai saling meniadakan menjadi 0 dan yang ditandai tumbuh hingga besarnya 1. (Tabel menunjukkan −1: sirkuit ini membangun difusi dengan tanda minus keseluruhan, fase global yang tidak dapat dideteksi oleh pengukuran apa pun. Centang {hideGlobalPhase} di bawah tabel dan nilainya menjadi 1.) Untuk empat item, satu putaran menemukan jawabannya dengan pasti. Gerbang CZ hanya membalik tanda |11⟩; ia sama dengan H, CNOT, H pada target.'
    },
    teleportation: {
      title: 'Teleportasi kuantum',
      goal: 'Pindahkan keadaan sebuah qubit dari qubit 0 ke qubit 2 menggunakan pasangan Bell bersama, dua pengukuran, dan dua bit klasik.',
      why: 'Teleportasi adalah cara jaringan kuantum memindahkan informasi kuantum. Ia menunjukkan keterbelitan dipakai sebagai sumber daya, dan mengapa keadaan kuantum tidak bisa begitu saja disalin.',
      steps: [
        'Penyiapan telah memberi qubit 0 (pesan Alice) sebuah keadaan: vektor Bloch-nya menunjuk ke x = 0, y = −0,71, z = 0,71, di tengah antara kutub utara dan −y.',
        'Bagikan pasangan Bell antara Alice (qubit 1) dan Bob (qubit 2): tekan H pada qubit 1, lalu CNOT dengan kontrol Q1, target Q2.',
        'Alice: tekan CNOT dengan kontrol Q0, target Q1, lalu H pada qubit 0.',
        'Alice mengukur: tekan M pada qubit 0 dan M pada qubit 1. Kedua bit klasik inilah yang ia “kirim” ke Bob.',
        'Koreksi Bob: jika qubit 1 memberi 1, tekan X pada qubit 2. Lalu, jika qubit 0 memberi 1, tekan Z pada qubit 2.',
        'Bandingkan bola Bloch qubit 2 dengan posisi awal qubit 0.'
      ],
      question: 'Dua pengukuran Alice memberi bit acak. Setelah koreksi Bob, ke mana arah vektor Bloch qubit 2?',
      options: [
        'Ke arah vektor qubit 0 di awal, apa pun bitnya',
        'Bergantung pada bit yang didapat Alice',
        'Ke pusat, karena ia terbelit'
      ],
      result: 'Apa pun bit yang didapat Alice, koreksi Bob membuat qubit 2 berada tepat dalam keadaan awal qubit 0. Qubit 0 telah diukur, jadi ia tidak lagi memiliki keadaan itu: keadaannya berpindah, bukan disalin. Sebelum koreksi, qubit 2 memuat salah satu dari empat versi pesan yang teracak, dan tanpa dua bit dari Alice, Bob tidak dapat mengetahui yang mana. Jadi tidak ada yang bergerak lebih cepat dari bit klasiknya. Cobalah beberapa kali: bitnya berubah, hasilnya tidak.'
    }
  },
  concepts: {
    title: 'Konsep Kuantum',
    intro: 'Rujukan untuk setiap gagasan yang dipakai di lab dan [pelajaran](/lessons). Gagasan yang sama berlaku untuk 1, 2, dan 3 qubit. Bagian-bagiannya bergerak dari dasar hingga algoritma; setiap tampilan di lab dijelaskan di akhir. Untuk cara menggunakan kontrolnya, lihat [{help}](/help).',
    sections: [
      {
        title: 'Qubit dan keadaan',
        items: [
          ['Qubit', 'Versi kuantum dari bit. Bit klasik bernilai 0 atau 1; qubit dapat berada dalam kombinasi (superposisi) dari |0⟩ dan |1⟩ sampai ia diukur.'],
          ['Keadaan basis', 'Hasil klasik yang dapat ditunjukkan sebuah register: |0⟩ dan |1⟩ untuk satu qubit, |00⟩ sampai |11⟩ untuk dua, |000⟩ sampai |111⟩ untuk tiga. Setiap qubit tambahan menggandakan jumlahnya: n qubit memiliki 2ⁿ keadaan basis. Di lab ini, qubit 0 adalah digit paling kiri.'],
          ['Amplitudo', 'Setiap keadaan basis memiliki bilangan kompleks yang disebut amplitudonya. Kuadrat besarnya, |amplitudo|², adalah probabilitas mengukur keadaan itu. Probabilitasnya selalu berjumlah 100%.'],
          ['Superposisi', 'Keadaan dengan lebih dari satu amplitudo bukan nol, seperti H|0⟩ = (|0⟩ + |1⟩)/√2. Ini adalah keadaan yang pasti, bukan ketidaktahuan tentang nilai tersembunyi: fasenya masih dapat berinterferensi.'],
          ['Fase', 'Sudut sebuah amplitudo pada bidang kompleks. Fase sendiri tidak mengubah probabilitas, tetapi ketika amplitudo digabungkan (misalnya oleh gerbang H), fase menentukan apakah amplitudo saling menjumlahkan atau meniadakan.'],
          ['Fase global', 'Memutar fase setiap amplitudo dengan sudut yang sama (mengalikan semuanya dengan e^(iα)) tidak mengubah apa pun yang dapat dideteksi oleh pengukuran, jadi hanya selisih fase yang bermakna fisis. {hideGlobalPhase}, di bawah tabel {stateTable}, memutar keadaan sehingga amplitudo bukan nol pertamanya real dan positif, yang membuat keadaan-keadaan yang hanya berbeda fase global tampak sama.'],
          ['Interferensi', 'Amplitudo dari lintasan yang berbeda saling menjumlahkan (konstruktif) atau meniadakan (destruktif). H lalu H mengembalikan |0⟩ karena lintasan menuju |1⟩ saling meniadakan; H, Z, H memberi |1⟩ karena Z membalik satu tanda.'],
          ['Pengukuran dan keruntuhan', 'Pengukuran memilih satu keadaan basis secara acak, dengan probabilitas yang diberikan oleh amplitudonya. Keadaan lalu runtuh ke hasil itu, jadi mengukur lagi memberi jawaban yang sama.'],
          ['Bola Bloch', 'Gambar keadaan satu qubit sebagai panah (vektor Bloch) di dalam bola. Kutub utara adalah |0⟩, kutub selatan adalah |1⟩, titik-titik di ekuator adalah superposisi 50/50, dan sudut mengelilingi ekuator adalah fasenya. Lab menggambar satu bola per qubit; lihat Tampilan di lab, di bawah.'],
          ['Mengukur satu qubit', 'Anda dapat mengukur satu qubit saja (tombol M). Hasilnya 0 atau 1, dan hanya amplitudo yang tidak sesuai dengan hasil itu yang dihapus; sisanya diskalakan ulang. Qubit lain mempertahankan superposisinya, kecuali jika terbelit dengan qubit yang diukur.']
        ]
      },
      {
        title: 'Gerbang',
        items: [
          ['Identitas (I)', 'Membiarkan qubit tidak berubah.'],
          ['Hadamard (H)', 'Mengubah |0⟩ menjadi superposisi seimbang dari |0⟩ dan |1⟩ (dan |1⟩ menjadi superposisi dengan tanda minus). Menerapkannya dua kali membatalkannya.'],
          ['Pauli-X (X)', 'NOT kuantum: menukar |0⟩ dan |1⟩.'],
          ['Pauli-Y (Y)', 'Menukar |0⟩ dan |1⟩ serta menambahkan fase: Y|0⟩ = i|1⟩.'],
          ['Pauli-Z (Z)', 'Membalik tanda (fase 180°) dari |1⟩; |0⟩ tidak berubah.'],
          ['Fase (S)', 'Memberi |1⟩ fase 90°. S yang diterapkan dua kali sama dengan Z.'],
          ['π/8 (T)', 'Memberi |1⟩ fase 45°. T yang diterapkan dua kali sama dengan S. Bersama H dan CNOT, gerbang ini cukup untuk membangun komputasi kuantum apa pun, dengan ketelitian berapa pun yang Anda perlukan.'],
          ['CNOT', 'Gerbang dua qubit: membalik qubit target jika qubit kontrol bernilai 1. Bersama H, gerbang ini menciptakan keterbelitan. Di lab ini, qubit mana pun dapat menjadi kontrol atau target.'],
          ['Controlled-Z (CZ)', 'Membalik tanda amplitudo di mana kedua qubit bernilai 1. Gerbang ini memperlakukan kedua qubit sama, jadi tidak penting mana yang menjadi kontrol. Gerbang ini sama dengan H, CNOT, H pada target.'],
          ['Gerbang sebagai putaran', 'Setiap gerbang satu qubit memutar bola Bloch: X, Y, dan Z adalah setengah putaran mengelilingi sumbunya masing-masing, H setengah putaran mengelilingi sumbu di tengah antara x dan z, S seperempat putaran dan T seperdelapan putaran mengelilingi z. Bola Bloch menganimasikan setiap gerbang sebagai putarannya.'],
          ['Matriks uniter', 'Matriks sebuah gerbang pada seluruh register: kolom j adalah apa yang dilakukan gerbang terhadap keadaan basis |j⟩. Kolom-kolomnya panjangnya 1 dan saling tegak lurus (U†U = I), itulah sebabnya probabilitas tetap berjumlah 1 dan gerbang dapat dibatalkan. Pengukuran atau derau tidak memiliki matriks seperti itu.'],
          ['Keterbalikan', 'Setiap gerbang dapat dibatalkan; informasi hanya hilang ketika Anda mengukur.']
        ]
      },
      {
        title: 'Beberapa qubit',
        items: [
          ['Keterbelitan', 'Qubit-qubit yang keadaan gabungannya tidak dapat dipecah menjadi keadaan terpisah untuk masing-masing. Mengukur satu qubit memberi tahu Anda tentang yang lain, dan mereka harus digambarkan sebagai satu sistem.'],
          ['Pasangan Bell', '(|00⟩ + |11⟩)/√2, dibuat dengan H pada qubit 0 lalu CNOT dari qubit 0 ke qubit 1. Setiap qubit secara terpisah acak, tetapi keduanya selalu sama.'],
          ['Keadaan GHZ', '(|000⟩ + |111⟩)/√2: ketiga qubit terbelit, selalu sama. Dibuat dengan H, lalu CNOT 0→1, lalu CNOT 1→2.'],
          ['Keadaan tereduksi', 'Keadaan satu qubit secara tersendiri, yang diperoleh dengan “menelusuri keluar” qubit lainnya (trace parsial). Bola Bloch menunjukkan keadaan tereduksi.'],
          ['Entropi keterbelitan', 'Seberapa terbelit satu qubit dengan sisanya: entropi von Neumann dari keadaan tereduksinya, dari 0 (tidak terbelit) hingga 1 bit (terbelit maksimal, seperti pada pasangan Bell). Untuk seluruh register dalam keadaan murni, nilainya 0 tepat ketika qubit itu dapat dipisahkan.'],
          ['Informasi bersama', 'Seberapa banyak hasil dua qubit memberi tahu tentang satu sama lain, dalam basis apa pun: I = S(A) + S(B) − S(AB), di mana S adalah entropi qubit A, qubit B, dan pasangan itu bersama. Nilainya dari 0 hingga 2 bit. Besaran ini menghitung keterkaitan klasik dan kuantum bersama-sama, jadi ia merupakan tanda korelasi, bukan bukti keterbelitan antara pasangan itu.'],
          ['Korelasi bukan keterbelitan', 'Bit yang selalu sama bisa terbelit (pasangan Bell) atau sekadar klasik (|00⟩). Graf korelasi menunjukkan kesamaan; tampilan Keterbelitan dan bola Bloch menunjukkan keterbelitan.']
        ]
      },
      {
        title: 'Derau dan perangkat keras sungguhan',
        items: [
          ['Keadaan campuran', 'Keadaan yang tidak dapat ditulis sebagai satu daftar amplitudo, sehingga vektor Bloch-nya lebih pendek dari 1. Keadaan ini dapat menggambarkan campuran acak dari beberapa keadaan, atau satu bagian dari sistem yang terbelit. Tanpa derau, register lab ini selalu dalam keadaan murni, jadi qubit yang tampak campuran secara tersendiri berarti terbelit dengan qubit lainnya. Setelah derau, register itu sendiri menjadi campuran, dan vektor Bloch yang pendek bisa juga berasal dari derau.'],
          ['Kemurnian', 'Seberapa jauh sebuah keadaan dari campuran acak, ditampilkan di bawah matriks densitas sebagai Tr ρ²: 1 untuk keadaan murni, lebih kecil setelah derau mencampurnya, hingga 1/2ⁿ untuk keadaan yang sepenuhnya acak.'],
          ['Derau dan dekoherensi', 'Qubit sungguhan terganggu oleh lingkungannya. Dephasing menghilangkan fase, redaman amplitudo menghilangkan energi (|1⟩ meluruh ke |0⟩), dan derau depolarisasi menimbulkan galat X, Y, atau Z secara acak. Masing-masing dapat diterapkan di lab. Derau memudarkan entri di luar diagonal (koherensi) dari matriks densitas, mengubah superposisi menjadi campuran acak: dekoherensi. Inilah hambatan utama dalam membangun komputer kuantum.'],
          ['Fidelitas', 'Seberapa dekat sebuah keadaan dengan keadaan murni sasaran |φ⟩: F = ⟨φ|ρ|φ⟩, dari 1 (sama) hingga 0. Dalam jalannya sirkuit dengan derau, {timelineView} membandingkan setiap langkah dengan sirkuit yang sama yang dijalankan tanpa derau, jadi Anda dapat melihat derau bertambah seiring jumlah langkah, bahkan pada langkah yang saling meniadakan.'],
          ['Galat pembacaan', 'Membaca sebuah qubit dapat mencatat bit yang salah meskipun qubit itu sebenarnya berada di nilai yang benar: galat klasik dalam pengukuran, bukan dalam keadaan kuantumnya. Pada perangkat keras sungguhan, 1 lebih sering terbaca sebagai 0 (biasanya beberapa persen), karena qubit dapat meluruh saat sedang dibaca.'],
          ['Mitigasi galat pembacaan', 'Membatalkan galat pembacaan setelah terjadi. Jika Anda tahu seberapa sering setiap bit salah terbaca, Anda dapat menghitung mundur dari jumlah yang tercatat untuk memperkirakan probabilitas yang sebenarnya (secara matematis, dengan mengalikan dengan invers tabel laju galat, yang disebut matriks kebingungan). Koreksi galat kuantum tidak diperlukan, tetapi menghitung mundur juga memperbesar sebaran acak, jadi dengan sedikit shot sebuah perkiraan bahkan bisa turun di bawah 0.']
        ]
      },
      {
        title: 'Algoritma',
        items: [
          ['Orakel', 'Kotak hitam yang menghitung sebuah fungsi f, biasanya dengan membalik sebuah qubit atau fase ketika f(x) = 1. Algoritma kuantum sering dinilai dari berapa kali ia perlu memanggil orakel.'],
          ['Phase kickback', 'Ketika orakel bekerja pada qubit target dalam keadaan (|0⟩ − |1⟩)/√2, pembalikan itu justru muncul sebagai tanda pada masukan. Hal ini mengubah jawaban menjadi fase yang dapat dibaca melalui interferensi.'],
          ['Deutsch–Jozsa', 'Menentukan apakah sebuah fungsi konstan atau seimbang dengan satu panggilan orakel saja. Setelahnya, qubit masukan terbaca nol semua hanya jika f konstan.'],
          ['Pencarian Grover', 'Menemukan item yang ditandai di antara N item dalam sekitar √N putaran. Setiap putaran menandai item dengan pembalikan tanda (orakel), lalu mencerminkan semua amplitudo terhadap rata-ratanya (difusi). Untuk empat item, satu putaran sudah cukup.'],
          ['Teleportasi', 'Memindahkan keadaan sebuah qubit ke qubit lain menggunakan pasangan Bell bersama, dua pengukuran, dan dua bit klasik yang memilih koreksinya. Keadaan aslinya hancur dalam prosesnya, jadi keadaan itu tidak pernah tersalin (teorema tanpa-kloning).'],
          ['Bit klasik', 'Hasil pengukuran. Lab menampilkannya di bawah tabel amplitudo. Dalam teleportasi, Bob memerlukan dua bit dari Alice untuk mengetahui koreksi mana yang harus diterapkan.'],
          ['Pengukuran tertunda', 'Pengukuran yang hasilnya mengendalikan gerbang berikutnya dapat diganti dengan gerbang terkendali, dengan pengukuran dipindahkan ke akhir, dan hasilnya tetap sama.']
        ]
      },
      {
        title: 'Tampilan di lab',
        items: [
          ['Tabel amplitudo', 'Amplitudo, probabilitas, dan fase setiap keadaan basis. Baris bernilai nol ditampilkan abu-abu. {hideGlobalPhase}, di bawahnya, menampilkan fase relatif terhadap amplitudo bukan nol yang pertama; tampilan 3D dan tampilan Interferensi mengikutinya.'],
          ['Grafik probabilitas', 'Satu batang per keadaan basis: peluang mengukurnya.'],
          ['Shot', 'Menjalankan keadaan saat ini berkali-kali (100 atau 1000 shot), mengukur setiap qubit setiap kali, lalu menghitung hasilnya, seperti yang dilakukan komputer kuantum sungguhan. Setiap batang adalah jumlah; garis di atasnya adalah probabilitas tepatnya. Keadaan di lab tidak berubah. Centang {readout} untuk mencatat beberapa bit secara salah, seperti pada perangkat keras sungguhan, dan {mitigate} untuk menghitung balik jumlahnya menjadi perkiraan probabilitas yang sebenarnya.'],
          ['Tampilan interferensi', 'Bagaimana gerbang terakhir menggabungkan amplitudo. Setiap amplitudo baru adalah jumlah lintasan dari amplitudo lama, digambar sebagai panah yang disambung ujung ke pangkal (warna menunjukkan fase). Panah yang searah saling menjumlahkan (konstruktif), yang berlawanan saling meniadakan (destruktif). Tampilan ini juga memberi probabilitas yang akan dimiliki hasilnya jika lintasan tidak berinterferensi.'],
          ['Bola Bloch', 'Satu per qubit. Kutub utara |0⟩, kutub selatan |1⟩, ekuator adalah superposisi 50/50, dan sudut kelilingnya adalah fase. Vektor dengan panjang 1 adalah keadaan murni. Vektor yang lebih pendek berarti qubit itu campuran: terbelit dengan qubit lainnya atau, setelah derau, sebagian teracak.'],
          ['Matriks densitas', 'Kisi yang menggambarkan seluruh keadaan, murni maupun campuran (untuk keadaan murni, ρ = |ψ⟩⟨ψ|). Diagonalnya memuat probabilitas; kotak di luar diagonal menunjukkan koherensi, tanda superposisi yang sejati dan bukan campuran acak. Luas kotak menunjukkan besar dan warnanya menunjukkan fase. Kemurniannya ditampilkan di bawahnya.'],
          ['Graf korelasi', 'Untuk setiap pasangan qubit, |⟨ZᵢZⱼ⟩|: 1,00 ketika bit hasil pengukurannya selalu sama (atau selalu berbeda), 0,00 ketika sama dan berbeda sama seringnya. Ini bukan ukuran keterbelitan: |00⟩ menunjukkan 1,00 tanpa ada yang terbelit, dan pasangan Bell dengan H tambahan pada satu qubit terbelit penuh tetapi menunjukkan 0,00.'],
          ['Nilai harapan Pauli', 'Hasil rata-rata ⟨P⟩, dari −1 hingga +1, dari mengukur setiap string Pauli: ⟨X⟩, ⟨Y⟩, ⟨Z⟩ untuk setiap qubit (vektor Bloch-nya), kisi 3 × 3 seperti ⟨X₀X₁⟩ untuk setiap pasangan, dan, untuk tiga qubit, string seperti ⟨XXX⟩. Jika kisi sebuah pasangan bukan hasil kali nilai-nilai tunggalnya, pasangan itu berkorelasi. Pasangan Bell berkorelasi di setiap basis (XX = +1, YY = −1, ZZ = +1); keterkaitan tiga arah keadaan GHZ hanya muncul pada ⟨XXX⟩. Mengukur semuanya adalah cara eksperimen membaca sebuah keadaan (tomografi keadaan).'],
          ['Tampilan keterbelitan', 'Menyebutkan qubit mana yang terbelit dengan qubit mana. Entropi keterbelitan S, per qubit, bernilai dari 0 (memiliki keadaan sendiri) hingga 1 bit (terbelit maksimal). Informasi bersama I, per pasangan, bernilai dari 0 (hasil tidak berhubungan di basis mana pun) hingga 2 bit; besaran ini menghitung setiap jenis keterkaitan, jadi bernilai 1 antara dua qubit mana pun dari keadaan GHZ.'],
          ['Tampilan 3D', 'Khusus tiga qubit: 8 keadaan basis di sudut-sudut sebuah kubus, berukuran sesuai probabilitas dan berwarna sesuai fase.'],
          ['Sirkuit', 'Urutan gerbang yang diterapkan secara berurutan. Bangun satu di editor sirkuit dan jalankan.'],
          ['Linimasa', 'Setelah sirkuit dijalankan atau dilangkahkan, satu bingkai per langkah, masing-masing digambar sebagai probabilitasnya. Memilih sebuah bingkai mengembalikan setiap tampilan ke keadaan itu.'],
          ['Tampilan matriks uniter', 'Matriks gerbang terakhir, atau seluruh sirkuit di editor, pada semua qubit. Setiap sel menunjukkan sebuah entri, berwarna sesuai fase seperti pada matriks densitas.']
        ]
      }
    ]
  },
  help: {
    title: 'Bantuan',
    intro: 'Cara menggunakan lab. Untuk gagasan di baliknya, lihat [{concepts}](/concepts); untuk belajar langkah demi langkah, ikuti [pelajaran](/lessons).',
    sections: [
      {
        title: 'Mulai cepat',
        blocks: [
          {
            ol: [
              'Buka [lab 1 qubit](/lab/1). Qubit dimulai sebagai |0⟩.',
              'Tekan **H** pada Q0. Probabilitasnya menjadi 50/50 dan panah bola Bloch berpindah ke ekuator.',
              'Tekan **{measureAll}**. Anda mendapat 0 atau 1 secara acak, dan keadaan runtuh ke hasil itu.',
              'Tekan **{undo}** untuk kembali ke sebelum pengukuran, atau **{reset}** untuk mulai lagi dari |0⟩.'
            ]
          },
          {
            p: 'Setiap tampilan diperbarui begitu Anda menekan sebuah gerbang. Bagian-bagian di bawah menjelaskan setiap kontrol.'
          }
        ]
      },
      {
        title: 'Memilih ukuran',
        blocks: [
          {
            p: 'Gunakan **{lab1}**, **{lab2}**, atau **{lab3}** di bagian atas. Setiap ukuran menyimpan keadaan dan sirkuitnya sendiri.'
          },
          {
            p: 'Lab dimulai dengan tabel {stateTable}, probabilitas, shot, bola Bloch, dan interferensi. **{showAdvanced}**, di bawah tampilan-tampilan ini, menambahkan panel {noisePanel}, matriks densitas, matriks uniter, korelasi, nilai harapan Pauli, keterbelitan, dan tampilan 3D. Tampilan ini sudah menyala jika Anda telah mencapai Bagian 3 pelajaran, dan lab mengingat pilihan Anda. Pelajaran menampilkan tampilan apa pun yang dibutuhkannya.'
          },
          {
            p: 'Di setiap label, qubit 0 adalah digit paling kiri: |10⟩ berarti qubit 0 bernilai 1 dan qubit 1 bernilai 0.'
          }
        ]
      },
      {
        title: 'Tata letak',
        blocks: [
          {
            ul: [
              'Di layar lebar, gerbang dan editor sirkuit tetap di kiri sementara Anda menggulir tampilan di kanan, sehingga Anda melihat efek setiap gerbang saat menekannya. Dalam pelajaran, langkah-langkah dan **{check}** juga ada di sana.',
              'Di layar sempit, seperti ponsel, tampilan berada dalam tab di atas gerbang (Keadaan, Probabilitas, Bola Bloch, dan seterusnya). Ketuk sebuah tab, atau gunakan tombol panah, untuk berganti tampilan.',
              '**{theme}**, di bagian atas, beralih antara warna terang dan gelap. **{themeSystem}** mengikuti pengaturan perangkat Anda.'
            ]
          }
        ]
      },
      {
        title: 'Gerbang dan tombol',
        blocks: [
          {
            ul: [
              'Setiap qubit (Q0, Q1, Q2) memiliki satu baris tombol gerbang: I, H, X, Y, Z, S, dan T, serta **M**, yang hanya mengukur qubit itu.',
              'Arahkan, fokuskan, atau ketuk sebuah gerbang untuk melihat fungsinya, di baris di bawah tombol.',
              '**CNOT** dan **CZ** (2 atau 3 qubit): pilih qubit **kontrol** dan **target** (target tidak boleh sama dengan kontrol), lalu tekan tombolnya. Untuk CZ, qubit mana yang menjadi kontrol tidaklah penting. Editor sirkuit memakai pilihan yang sama.',
              '**{bell}** dan **{ghz}** selalu dimulai dari |0…0⟩, sehingga selalu memberi keadaan yang sama.',
              '**{measureAll}** memilih hasil untuk setiap qubit secara acak dan meruntuhkan keadaan ke hasil itu. **{reset}** kembali ke |0…0⟩.',
              'Hasil pengukuran muncul sebagai **bit klasik** di bawah tabel amplitudo. {reset} menghapusnya.',
              '**{undo}** (atau Ctrl+Z, ⌘Z di Mac) mundur melalui apa yang telah Anda lakukan: gerbang, pengukuran, {reset}, dan perubahan sirkuit. Bahkan pengukuran pun dapat diurungkan, karena simulator mengingat keadaan sebelumnya; komputer kuantum sungguhan tidak bisa.',
              'Anda boleh menekan tombol secepat apa pun: setiap operasi menunggu operasi sebelumnya selesai.'
            ]
          }
        ]
      },
      {
        title: 'Editor sirkuit',
        blocks: [
          {
            ul: [
              'Gerbang disusun seperti panel {gatesPanel}: satu baris per qubit. **H** di baris Q1 menambahkan “H q1”; **M** di sebuah baris mengukur qubit itu ketika sirkuit berjalan.',
              '**CNOT** dan **CZ** memakai kontrol dan target yang dipilih di sebelahnya, pilihan yang sama dengan di panel {gatesPanel}.',
              'Tambahkan gerbang dengan mengetuk atau mengekliknya, menyeretnya ke area sirkuit (tetikus, jari, atau pena), atau memfokuskannya lalu menekan Enter.',
              'Tekan **×** pada sebuah langkah untuk menghapusnya (dengan papan ketik, Tab ke tombol itu lalu tekan Enter). **{clear}** menghapus semua langkah. {undo} mengembalikannya.',
              '**{run}** menerapkan setiap langkah secara berurutan, berselang setengah detik, sambil menyorot setiap langkah yang sedang berjalan.',
              '**{step}** menerapkan satu langkah setiap kali, sehingga Anda dapat melihat efek setiap gerbang. Tekan lagi untuk langkah berikutnya; setelah langkah terakhir, ia mulai lagi dari awal.',
              'Jalankan dan {step} dimulai dari |0…0⟩, sehingga sebuah sirkuit selalu memberi hasil yang sama. Hapus centang **{fromZero}** untuk menerapkan sirkuit pada keadaan saat ini.',
              'Selama sirkuit berjalan, tombol gerbang menunggu sampai selesai.',
              'Setelah sirkuit dijalankan atau dilangkahkan, **{timelineView}** di bawah editor menunjukkan keadaan setelah setiap langkah. Pilih sebuah bingkai, seret penggeser, atau gunakan {back} dan {forward} untuk mengembalikan lab ke sana; setiap tampilan mengikuti, dan {step} melanjutkan dari titik itu. Pengukuran mempertahankan hasil yang diberikannya. Mengubah sirkuit, atau menekan tombol lain, memulai linimasa baru.'
            ]
          }
        ]
      },
      {
        title: 'Pelajaran',
        blocks: [
          {
            ol: [
              '**Prediksi.** Pilih jawaban yang Anda harapkan sebelum mencoba apa pun. Menebak juga tidak apa-apa: jawaban pertama Anda masuk ke penghitungan, yang hanya Anda yang melihatnya.',
              '**Coba.** Ikuti langkah-langkah di lab di sebelahnya. **{setUp}** mengembalikan lab ke keadaan awal pelajaran; **{showMe}** menjalankan langkah-langkahnya untuk Anda, perlahan; **{check}** memberi tahu apakah lab kini menunjukkan hasil yang diharapkan, dan apa yang kurang jika belum.',
              '**Apa yang terjadi** muncul setelah Anda memprediksi, atau setelah hasil Anda sesuai, dan menjelaskannya.'
            ]
          },
          {
            p: 'Setiap pelajaran hanya menampilkan tampilan yang dibutuhkannya. Gunakan tautan di bagian bawah untuk pindah ke pelajaran sebelumnya atau berikutnya.'
          }
        ]
      },
      {
        title: 'Shot dan galat pembacaan',
        blocks: [
          {
            ul: [
              'Tampilan **{shotsView}** menjalankan keadaan saat ini 100 atau 1000 kali, mengukur setiap qubit setiap kali, lalu menghitung hasilnya, seperti yang dilakukan komputer kuantum sungguhan. Garis pada setiap batang adalah probabilitas tepatnya. Keadaan di lab tidak berubah.',
              'Centang **{readout}** dan atur seberapa sering 1 terbaca sebagai 0 dan 0 sebagai 1. Jumlahnya kemudian adalah apa yang tercatat, termasuk salah baca, sementara keadaannya tetap.',
              'Centang **{mitigate}** untuk menambahkan batang ungu: perkiraan probabilitas yang sebenarnya, dihitung balik dari jumlahnya. Lihat [{concepts}](/concepts) untuk alasan perkiraan ini bisa menyebar.'
            ]
          }
        ]
      },
      {
        title: 'Derau (lanjutan)',
        blocks: [
          {
            ul: [
              'Pilih **{dephasing}** (kehilangan fase), **{damping}** (kehilangan energi, jatuh ke |0⟩), atau **{depolarizing}** (galat acak), atur kekuatannya, lalu tekan **{noiseQ0}** (atau qubit lain) atau **{noiseEvery}**.',
              'Derau membuat keadaan **campuran**: campuran acak yang hanya dapat digambarkan oleh matriks densitas. Matriks densitas (dengan kemurniannya), bola Bloch, probabilitas, shot, dan nilai harapan Pauli menampilkannya. Tabel menampilkan probabilitas tetapi tidak amplitudo, dan tampilan Interferensi serta Keterbelitan berhenti sejenak, sambil menjelaskan alasannya.',
              'Saat tampilan lanjutan menyala, editor sirkuit memiliki keping **N** di baris setiap qubit. Keping ini menambahkan derau yang dipilih di panel {noisePanel} (jenis dan kekuatannya, misalnya “Dephase 10% q1”) sebagai sebuah langkah, sehingga derau dapat menjadi bagian dari sirkuit dan linimasanya. Setiap langkah N mempertahankan kekuatan saat ia ditambahkan.',
              'Centang **Jalankan dengan derau** di editor sirkuit untuk menjalankan sirkuit pada perangkat keras berderau yang disimulasikan: Jalankan dan {step} menambahkan derau yang dipilih ke setiap qubit setelah setiap langkah. {timelineView} kemudian menunjukkan **fidelitas** setiap bingkai (seberapa dekat, dari 1 hingga 0) terhadap sirkuit yang sama yang dijalankan tanpa derau, serta kurva penurunannya langkah demi langkah. Setelah pengukuran, fidelitas menunjukkan —, karena tidak ada satu keadaan tanpa derau untuk dibandingkan.',
              'Gerbang tetap bekerja pada keadaan campuran. **{measureAll}** atau **{reset}** membuatnya murni kembali, dan {undo} dapat mundur melewati derau seperti tindakan lainnya.'
            ]
          }
        ]
      },
      {
        title: 'Tampilan 3D (3 qubit)',
        blocks: [
          {
            ul: [
              'Seret dengan tetikus atau satu jari untuk memutar kubus.',
              'Gunakan roda tetikus, atau cubit dengan dua jari, untuk memperbesar dan memperkecil.',
              'Dengan papan ketik: tombol panah memutarnya, dan + serta − memperbesar dan memperkecil.',
              'Di ponsel, mulailah menggulir halaman di luar tampilan 3D.'
            ]
          }
        ]
      },
      {
        title: 'Membaca tampilan tanpa warna, dan dengan pembaca layar',
        blocks: [
          {
            ul: [
              'Arahkan, ketuk, atau fokuskan **matriks densitas** dan gunakan tombol panah: kotak yang Anda pilih diberi garis tepi dan besar serta fase tepatnya muncul di bawahnya.',
              'Tampilan **{shotsView}**, **{interferenceView}**, dan **{entanglementView}** memberikan setiap angka yang digambarnya sebagai teks di samping gambar. Tampilan **{pauliView}** adalah sekumpulan tabel: setiap sel mencetak nilainya beserta tandanya, dan warnanya (biru positif, oranye negatif) hanya mengulanginya.',
              'Arahkan ke atau ketuk sebuah sudut **tampilan 3D** untuk membaca probabilitas dan fasenya. Dengan papan ketik, fokuskan tampilan itu dan gunakan tombol panah untuk memutarnya, serta + dan − untuk memperbesar dan memperkecil.',
              'Dengan pembaca layar, setiap tindakan diikuti ringkasan singkat tentang apa yang dilakukannya dan hasil yang mungkin, seperti “H pada qubit 0. Sekarang: |0⟩ 50%, |1⟩ 50%.” Grafik memiliki deskripsi teks, dan tabel {stateTable} memuat setiap angka.',
              'Satu-satunya animasi adalah vektor Bloch yang berputar ketika gerbang satu qubit diterapkan, selama kurang dari setengah detik. Jika perangkat Anda diatur untuk mengurangi gerakan, vektor langsung melompat; sumbu dan lintasan putarannya tetap digambar, dan sebuah keterangan menyebutkan putarannya dengan kata-kata. Jalannya sirkuit atau {showMe} mengubah tampilan secara bertahap berselang setengah detik, sehingga Anda dapat mengikutinya.',
              '**{unitaryView}** dan **{timelineView}** berupa tabel dan tombol: setiap entri matriks dan setiap bingkai memiliki nilainya sebagai teks.'
            ]
          }
        ]
      },
      {
        title: 'Penyimpanan dan privasi',
        blocks: [
          {
            ul: [
              'Setiap ukuran lab menyimpan keadaan dan sirkuitnya di peramban ini dan memulihkannya ketika Anda kembali.',
              'Pelajaran memakai lab-nya sendiri dan tidak mengubah keadaan tersimpan Anda.',
              'Di setiap pelajaran, **prediksi pertama** Anda adalah yang dihitung dalam penghitungan Anda. Ketika Anda kembali ke sebuah pelajaran, prediksi itu ditampilkan, dan **{practise}** memungkinkan Anda menjawab lagi tanpa mengubahnya.',
              'Prediksi pelajaran Anda, tema Anda, apakah Anda sudah melihat sambutan, apakah tampilan lanjutan menyala, dan apakah fase global disembunyikan juga hanya disimpan di peramban ini.',
              'Tidak ada yang dikirim ke server: tidak ada akun dan tidak ada pelacakan.'
            ]
          }
        ]
      }
    ]
  }
};
