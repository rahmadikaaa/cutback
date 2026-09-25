# Cutback — Dokumen Kebutuhan Produk

Versi: **0.3**
Tanggal: **21 September 2026**
Status: **Arah produk telah diperbarui; rekonsiliasi requirements/design masih tertunda. Prototipe UI tersedia; MVP fungsional belum diverifikasi.**

Revisi ini memperbarui `cutback-prd(6).md` v0.2 yang diberikan pengguna secara langsung. Revisi ini memasukkan screenshot prototipe yang diberikan, snapshot README, serta audit frame berikutnya. Paket penyelarasan PRD v0.2 / requirements v0.4 yang dibuat secara terpisah tetap merupakan kandidat, bukan bukti bahwa spesifikasi desain dan perilaku telah sepenuhnya direkonsiliasi. PRD sumber merujuk requirements v0.4, tetapi file mandiri yang cocok tidak diberikan dalam review tersebut; sumber requirements yang diperiksa langsung adalah v0.3. Pilih dan perbarui satu file requirements kanonis sebelum menyatakan penyelarasan lintas dokumen selesai. Pembaruan ini hanya mengubah PRD.

## Changelog

| Versi | Tanggal     | Perubahan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.3   | 21 Sep 2026 | Memasukkan positioning transformation journey, bukti screenshot/README, status prototipe-versus-MVP, tindakan rekonsiliasi desain, delivery gates, dan provenance spesifikasi. Mempertahankan catatan mobile, ADK/GCP, scope, dan event historis tanpa mengklaim verifikasi eksternal baru.                                                                                                                                                                                                                            |
| 0.2   | 19 Sep 2026 | Memperjelas web mobile-first sebagai platform utama; menambahkan arah pengalaman dan acceptance khusus smartphone; menyinkronkan delivery foundation-first dengan BF-01–BF-09; mempertahankan arah Google ADK dan agent-skills; memisahkan MVP saat ini dari milestone Android/Play Store berikutnya; memperbarui penyelarasan AI Builder Cup menggunakan sumber resmi yang dapat diakses; menandai konflik sumber event yang belum terselesaikan dan item T&C yang tidak dapat diakses sebagai memerlukan verifikasi. |
| 0.1   | 19 Sep 2026 | Mengonsolidasikan arah produk, fondasi backend, Google ADK, agent-skills, target GCP, dan delivery bertahap.                                                                                                                                                                                                                                                                                                                                                                                                           |

## 1. Tujuan produk

Cutback membantu pengguna menentukan potongan rambut yang akan dipilih, memahami bagaimana tampilannya pada foto mereka sendiri, mengomunikasikan pilihan tersebut dengan jelas kepada barber, dan kemudian membuka kembali potongan rambut yang sama tanpa harus merekonstruksi keputusan dari ingatan.

**Narasi produk:** “Transformation Journey for Your Best Haircut.”

Journey ini membantu pengguna memahami penampilan saat ini, mengeksplorasi arah yang realistis, melihat preview transformasi yang dipilih, mengomunikasikannya, dan mengingat pilihan tersebut. “Journey” tidak menambahkan timeline foto longitudinal atau pelacakan pasca-potong rambut ke dalam MVP.

**Prinsip pengalaman:** “Identity stays. Hair transforms.” Pertahankan identitas yang dapat dikenali, pose, framing, dan background sedekat mungkin ketika membandingkan rambut asli dan rambut hasil simulasi. Ini merupakan target kualitas yang membutuhkan evaluasi visual, bukan jaminan model yang telah diverifikasi.

**Tagline:** “Your best haircut, remembered.” / “Biar ganteng konsisten.”

### 1.1 Masalah yang ingin diselesaikan

1. Pengguna sering tahu bahwa mereka ingin terlihat lebih baik, tetapi tidak mengetahui nama potongan rambut atau gaya mana yang cocok.
2. Foto referensi orang lain tidak menunjukkan bagaimana gaya tersebut mungkin terlihat pada pengguna.
3. Instruksi kepada barber seperti “rapihin”, “tipisin”, atau “jangan terlalu pendek” bersifat ambigu.
4. Potongan rambut yang pernah berhasil sulit diulang ketika pengguna tidak menyimpan model, detail, referensi, atau instruksi untuk barber.

### 1.2 Pengguna utama dan peran produk

Pengguna utama adalah seseorang—dengan fokus awal pada pria—yang menginginkan bantuan sebelum potong rambut dan kemudian ingin mengulang potongan rambut yang berhasil. Barber adalah penerima barber brief yang ditunjukkan pengguna; akun barber atau dashboard bisnis barber tidak diperlukan untuk MVP.

Cutback menargetkan tema **Retail & Commerce** untuk AI Builder Cup karena meningkatkan discovery dan personalisasi pelanggan dalam pengalaman service-commerce: pengguna menemukan potongan rambut, mengevaluasi opsi yang dipersonalisasi, mengomunikasikan layanan yang diinginkan, dan dapat menggunakan kembali keputusan yang sama pada kunjungan berikutnya.

### 1.3 Bukti saat ini dan status produk — 21 September 2026

Bukti yang direview terdiri dari sepuluh screenshot yang diberikan dan `README(1).md`. Screen mencakup landing, input foto, analisis, preferensi opsional, rekomendasi, kontrol preview original/possible, barber brief (termasuk varian notes), konfirmasi save, dan My Haircuts. Ini adalah review frame statis, bukan audit interaksi langsung, source code, backend, atau deployment.

| Area                | Bukti yang ditunjukkan                                                        | Yang masih belum diverifikasi                                                   |
| ------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Arah visual         | Navy gelap, aksen emas, tipografi editorial, portrait yang menonjol           | Layout responsif, contrast terukur, kualitas motion                             |
| Input foto          | Panduan, sample, aksi own-photo, consent, tampilan foto terpilih              | Pemrosesan arbitrary upload, validation, default consent/perilaku network       |
| Analisis            | Observasi simulasi dan state Unknown                                          | Output AI nyata, correction controls, schema enforcement                        |
| Preferences         | Kategori opsional, Skip, notes counter                                        | Penerapan ke rekomendasi nyata; semantik opsi final                             |
| Recommendations     | Nama style, rationale, effort, considerations, selection controls             | Hasil personalisasi, provenance gambar, seluruh alternatif                      |
| Preview             | Kontrol Original/Possible, label simulation, retry dan jalur no-preview       | Generation nyata, konsistensi identitas sepanjang motion, perilaku paid-request |
| Barber brief        | Detail potongan, gambar original/simulation, notes yang terlihat dapat diedit | Perilaku editing, konsistensi revision, fallback/error handling                 |
| Save and repeat     | Screen save success; saved card, date, open/repeat/delete actions             | Persistence durable, reload, deletion, repeat tanpa AI                          |
| Backend dan hosting | ADK/GCP tetap menjadi arah yang dituju                                        | Penyelesaian foundation, stack aktual, cloud deployment, integrasi AI live      |

Milestone saat ini yang tercapai pada tingkat bukti: prototipe UI merepresentasikan journey utama dengan AI yang disimulasikan. Kontrol yang terlihat tidak membuktikan perilaku bekerja; konfirmasi save tidak membuktikan persistence. State yang tidak terdapat pada screenshot diklasifikasikan sebagai belum terbukti, bukan terbukti tidak ada dalam aplikasi.

## 2. Keputusan produk dan platform

### 2.1 Platform utama

Cutback adalah **web app mobile-first**.

* Smartphone adalah perangkat penggunaan utama dan constraint desain utama.
* Desktop tetap didukung sehingga web application yang sama dapat dibuka dan digunakan pada layar yang lebih besar.
* Web MVP tidak boleh bergantung pada kemampuan native Android untuk menyelesaikan core flow.
* Aplikasi native Android dan publikasi Google Play tetap menjadi **milestone berikutnya**, bukan requirement MVP dan bukan blocker AI Builder Cup kecuali organizer kemudian menyatakan sebaliknya.

### 2.2 Core experience

Flow new-haircut kanonis adalah:

**Upload → validation → analysis → recommendations → select model → preview → barber brief → save → reopen**

Aturan produk:

* Consent harus diperoleh sebelum foto dikirim untuk processing. Pemilihan/validasi file lokal dapat dilakukan terlebih dahulu; validasi server dan visual dilakukan setelah consent.
* Pengguna dapat mengoreksi detail rambut yang dapat diamati sebelum recommendations diperbarui; preference entry tidak menggantikan kemampuan correction ini.
* Input preference bersifat opsional dan tidak boleh memblokir pengguna sebelum photo upload atau initial analysis.
* Preview hanya dibuat untuk model yang secara eksplisit dipilih oleh pengguna.
* Navigasi antar-screen tidak boleh secara diam-diam memicu image generation tambahan.
* Preview yang gagal tidak boleh menghapus recommendations dan tidak boleh mencegah pengguna membuat barber brief tanpa preview.
* Membuka kembali saved haircut tidak boleh membutuhkan AI analysis atau image generation baru.

### 2.3 Repeat experience

Repeat flow adalah:

**My Haircuts → select saved haircut → reopen saved brief → show it again or create a new variation**

Kemampuan repeat baseline adalah membuka kembali haircut yang sengaja disimpan. Merekonstruksi haircut dari foto eksternal lama merupakan kemampuan terpisah di luar MVP ini kecuali secara eksplisit dipromosikan melalui perubahan scope.

Prototipe saat ini menampilkan Open Brief dan Repeat This Cut. Keduanya harus menggunakan kembali saved snapshot tanpa AI dalam baseline ini. Apakah kontrol tersebut akan digabung atau dibedakan presentasinya tetap menjadi keputusan desain; tidak satu pun label mengizinkan regeneration otomatis atau membuktikan kunjungan haircut lain benar-benar terjadi. Variation baru harus mempertahankan saved record asli.

## 3. Scope produk

### 3.1 Target MVP fungsional

MVP fungsional mencakup:

* photo upload, consent, dan validation;
* AI analysis terhadap karakteristik wajah/rambut yang terlihat;
* haircut recommendations;
* simple preferences opsional;
* model selection;
* satu personal preview per explicit preview request untuk selected model;
* barber brief;
* save, reopen, dan delete haircut;
* repeat tanpa AI generation baru;
* error, retry, quota, privacy, dan consistency handling yang diperlukan agar core flow dapat dipercaya;
* minimum event instrumentation yang diperlukan untuk memahami apakah pengguna menyelesaikan flow.

### 3.2 Kemampuan produk berikutnya

Berikut tetap menjadi bagian dari arah produk tetapi tidak diperlukan untuk functional MVP pertama kecuali secara eksplisit dipromosikan dalam revisi berikutnya:

* detailed structured haircut customization;
* automatic barber-brief image export;
* refinement rename/favorite di luar minimum save behavior;
* post-haircut actual photo dan rating;
* account-based cross-device synchronization jika initial save mode menggunakan device-local;
* aplikasi native Android dan Google Play release.

### 3.3 Di luar scope MVP saat ini

Jangan menambahkan hal berikut ke MVP hanya demi kelengkapan atau presentasi kompetisi:

* barber booking;
* marketplace;
* payment;
* production advertising/monetization;
* barber business dashboard;
* live AR;
* 3D head modeling;
* multi-angle generation;
* unrestricted visual hair-area editing;
* training proprietary foundation model atau membuat face dataset;
* jaminan bahwa hasil barber akan sama dengan AI simulation.

## 4. Prinsip pengalaman mobile-first

Produk dianggap mobile-first hanya jika main flow benar-benar dapat digunakan dari smartphone, bukan sekadar responsif dalam desktop emulator.

### 4.1 Ekspektasi minimum interaksi

* Main flow harus bekerja pada **viewport width 360 CSS px** tanpa horizontal scrolling.
* Primary interactive controls menggunakan target internal setidaknya **44 × 44 CSS px**.
* Upload experience harus memungkinkan pengguna memilih foto dari device dan, ketika browser/device mendukung, mengambil foto baru. Fallback normal file-upload harus selalu tersedia.
* Virtual keyboard tidak boleh secara permanen menutupi active input, validation message, atau control yang diperlukan untuk melanjutkan.
* Foto original dan generated preview harus dapat diperiksa dengan jelas pada smartphone, dengan label yang mencegah pengguna salah mengira original photo sebagai AI simulation.
* Loading, failure, retry, reconnect, dan unknown-job states harus memberi tahu pengguna apa yang terjadi dan tindakan aman berikutnya.

### 4.2 Kontinuitas draft

Sampai mekanisme persistence final dipilih, baseline produk adalah:

* navigasi di dalam active flow mempertahankan current draft;
* berpindah sementara ke aplikasi lain dan kembali harus mempertahankan draft selama browser menjaga page/session tetap hidup;
* unsaved draft **tidak dijamin** bertahan setelah manual refresh, tab close, browser process eviction, device restart, atau operating-system memory reclamation;
* UI tidak boleh mengimplikasikan persistence yang lebih kuat daripada yang benar-benar telah diimplementasikan;
* setelah haircut secara eksplisit berhasil disimpan, saved record harus bertahan setelah refresh sesuai chosen storage mode.

### 4.3 Bukti validasi mobile

Sebelum functional MVP dianggap siap untuk external demo:

* verifikasi core flow pada **Chrome on Android** dan **Safari on iOS**;
* catat apakah setiap hasil berasal dari real device atau emulator/simulator;
* bukti emulator dapat mempercepat development tetapi tidak menggantikan final real-device verification untuk primary mobile flow.

### 4.4 Arah visual dan motion

Pertahankan arah editorial navy/gold dan portrait-led experience yang ada. Gunakan motion agar transformasi hairstyle yang dipilih dapat dipahami sambil menjaga subject tetap stabil secara visual. Original dan generated images harus tetap dapat dibedakan; motion tidak boleh mengimplikasikan live generation ketika berpindah antar-existing assets. Motion timings dan implementation berada di design specification. Screenshot statis tidak membuktikan motion acceptance.

Jaga navigation tetap predictable pada screen yang sebanding. Ketika bottom navigation digunakan, perilakunya harus konsisten; content dan actions harus menghormati device safe areas. Persistent bottom navigation bar tidak diasumsikan telah diimplementasikan hanya dari screenshot tersebut.

### 4.5 Tindakan rekonsiliasi dari frame audit

Tindakan berikut memperbaiki agreed flow; tidak membutuhkan redesign total. Requirement ID di bawah merujuk behavioral source yang diperiksa dan harus dipertahankan ketika source tersebut diperbarui.

| ID    | Observasi                                                                                               | Hasil yang diwajibkan / keputusan yang tersisa                                                                                                                                                                                | Trace                        |
| ----- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| AL-01 | Recommendation menampilkan portrait sebelum selected-style preview, tanpa label image-source yang jelas | Identifikasi sebagai original atau reference/demo imagery sesuai konteks. Jangan mengimplikasikan setiap recommendation sudah memiliki generated personal preview. Pertahankan explicit selected-style generation.            | FR-03/05                     |
| AL-02 | Preferences menggunakan Shorter / Keep current / Slightly longer                                        | Pertahankan relative intent dalam eventual data contract; jangan diam-diam memetakan ke absolute short/medium/long. Jelaskan ketika longer style membutuhkan pertumbuhan rambut. Final option set masih harus direkonsiliasi. | FR-04                        |
| AL-03 | Medium effort adalah 5–10 menit di preferences dan 10–15 menit di recommendation                        | Tetapkan satu category definition atau jelaskan secara eksplisit recommendation yang melampaui preference. Exact thresholds tetap menjadi keputusan design/content.                                                           | FR-03/04                     |
| AL-04 | Analysis menawarkan preferences, tetapi tidak ada visible correction action                             | Sediakan cara mengoreksi hair observations dan invalidate dependent recommendations secara tepat.                                                                                                                             | FR-02/10                     |
| AL-05 | Original view juga menampilkan simulated-preview badge; Retry terlihat tanpa error yang ditampilkan     | Label Original versus AI simulation pada level image; action text harus mencerminkan failed versus available preview states. Tampilkan usage limits sebelum paid actions.                                                     | FR-05/10                     |
| AL-06 | Save screen menjanjikan reopening; local/account storage masih belum diputuskan                         | Sesuaikan save messaging dengan persistence mode yang dipilih. Konfirmasi success hanya setelah storage berhasil; dukung refresh dan clear save failure.                                                                      | FR-08/12                     |
| AL-07 | My Haircuts menampilkan Open Brief dan Repeat This Cut                                                  | Selesaikan redundansi control sambil mempertahankan snapshot reuse dan zero AI calls saat reopening.                                                                                                                          | FR-11                        |
| AL-08 | Happy-path screenshots mendominasi supplied evidence                                                    | Periksa atau tambahkan invalid-input, loading, analysis failure, preview failure, quota exhausted, stale result, failed save, empty list, dan delete-confirmation states.                                                     | FR-01/08/10                  |
| AL-09 | Desktop screenshots menunjukkan narrow central layout                                                   | Verifikasi 360 CSS px, target 44×44, keyboard/safe areas, text contrast, dan real mobile browsers; jangan menandai passed hanya berdasarkan proporsi screenshot.                                                              | Mobile criteria di Section 4 |
| AL-10 | Consent copy menyatakan no training/public sharing                                                      | Sesuaikan setiap data-use statement dengan implementation/provider settings yang dipilih. Screenshot checked tidak membuktikan unchecked default atau enforced consent.                                                       | FR-01/12; privacy            |

## 5. Strategi delivery

### 5.1 Milestone aktif — rekonsiliasi prototipe yang ada dan verifikasi foundation

Objective engineering berikutnya adalah menghubungkan prototipe yang ada ke foundation yang terverifikasi. Periksa exported repository sebelum memutuskan apa yang akan digunakan kembali atau diimplementasikan. Rekonsiliasi slice UI/behavior yang relevan sambil memverifikasi **BF-01 hingga BF-09**, yang awalnya didokumentasikan dalam PRD v0.1; keberadaannya dalam standalone requirements v0.4 belum diverifikasi di sini. Tujuannya adalah membuktikan bahwa application dapat berjalan lokal, mengekspos stable API boundary, memanggil Google AI melalui runtime yang dipilih, menangani error dengan aman, dan dapat dipaketkan menuju GCP deployment sebelum full product flow diimplementasikan.

Pertahankan foundation deliverables berikut ketika membuat task plan berikutnya:

| ID    | Deliverable dan bukti penyelesaian                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------ |
| BF-01 | Project structure dan local setup dapat direproduksi dari fresh checkout menggunakan documented commands.                      |
| BF-02 | API dan health endpoint; health tidak memanggil paid AI.                                                                       |
| BF-03 | Minimal ADK integration dengan satu verified real Google model response; diagnostic success bukan haircut-analysis completion. |
| BF-04 | Environment configuration dengan clear missing-configuration errors dan tanpa committed secrets.                               |
| BF-05 | Structured success/error contracts, request IDs, input validation, timeout/provider failure handling.                          |
| BF-06 | Safe logs dan endpoint protection; tidak ada secrets, photos, atau personal notes di logs.                                     |
| BF-07 | Relevant health/validation/error tests ditambah separately controlled real-AI smoke test.                                      |
| BF-08 | Build/package dan GCP deployment instructions; bedakan prepared deployment dari verified cloud execution.                      |
| BF-09 | Review applicable agent-skills guidance, catat selected revision/tool setup, dan pertahankan product-spec authority.           |

Semua BF completion states tetap belum diverifikasi dalam dokumen ini. Jangan membuat ulang pekerjaan yang sudah selesai tanpa memeriksa repository evidence. Foundation completion bukan product MVP completion, dan ketersediaan prototype bukan bukti foundation telah tersedia.

### 5.2 Phase 1 — finalisasi satu flow pada satu waktu

Untuk setiap product slice, gunakan:

**requirement → minimum design → tasks → implementation → acceptance test → decision record**

Design tidak harus exhaustive sebelum semua development dimulai, tetapi bagian yang sedang diimplementasikan harus memiliki design yang cukup untuk menghindari tebakan terkait contracts, ownership, storage, security, atau AI behavior.

### 5.3 Phase 2 — functional MVP

Urutan implementation yang direkomendasikan:

1. valid photo → structured analysis;
2. analysis + optional preferences → recommendations → select model;
3. selected model → explicit personal preview request;
4. final choice → barber brief;
5. save → refresh/reopen → repeat/delete;
6. harden mobile browser behavior, error recovery, privacy, quota, dan instrumentation di seluruh flow.

### 5.4 Phase 3 — GCP validation dan submission package

Deploy versi kecil yang terverifikasi cukup awal untuk mengungkap configuration dan permission issues. Ketika product flow selesai, ulangi end-to-end test terhadap actual submission deployment dan siapkan competition evidence package.

### 5.5 Completion gates

| Gate                    | Bukti yang diperlukan                                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Design/spec alignment   | AL-01–AL-10 terselesaikan atau secara eksplisit dijadwalkan dengan dependencies; satu canonical requirements version; tidak ada hidden product decisions di tasks.                                           |
| Foundation              | BF evidence termasuk controlled real ADK call dan protected paid operations.                                                                                                                                 |
| Functional MVP          | Own-photo flow menggunakan real AI; preview quality yang dapat direview; consistent brief; save → refresh → reopen → delete; repeat dengan zero new AI requests; relevant failure/privacy/quota checks pass. |
| External demo readiness | Real mobile-browser evidence sesuai Section 4, working deployed flow, truthful labels dan documented limitations.                                                                                            |
| Submission readiness    | Current event rules diperiksa, unresolved eligibility/source questions ditangani, required materials disiapkan dan links diuji.                                                                              |

Tidak satu pun completion gate ini ditandai passed oleh pembaruan PRD ini. Tasks dapat berjalan untuk slice yang sudah cukup terspesifikasi sambil mencatat unresolved dependencies.

## 6. Arah backend dan AI

Arah berikut dipertahankan dari PRD v0.1:

* **Google ADK** adalah runtime direction untuk Cutback AI agent layer.
* **addyosmani/agent-skills** adalah sumber guidance development/coding-agent, bukan application runtime dan bukan pengganti product requirements.
* Development dan early testing dilakukan secara lokal.
* Target competition deployment adalah **Google Cloud**, dengan exact deployable service dipilih di `design.md` sesuai current event rules.
* Application code tetap bertanggung jawab atas validation, authentication/ownership, privacy, quotas, job consistency, dan persistence. ADK tidak menghilangkan tanggung jawab tersebut.
* Multi-agent architecture bukan requirement. Tambahkan agents hanya ketika concrete responsibility dan measurable benefit membenarkan complexity tersebut.

Hal berikut berada di `design.md`, bukan PRD ini:

* web dan backend framework choices;
* exact repository layout;
* endpoint definitions dan transport format;
* request/response schemas;
* AI model identifiers dan structured-output schema;
* storage/database/object-storage choice;
* background-job strategy;
* image optimization dimensions/quality thresholds;
* local vs account persistence implementation;
* authentication implementation;
* exact GCP services dan deployment topology.

## 7. Prinsip kualitas, privacy, dan cost

* AI outputs adalah estimates atau simulations, bukan guarantees.
* Unknown visual attributes dilaporkan sebagai unknown, bukan dibuat-buat.
* User photos bersifat private by default dan tidak dimasukkan ke logs atau analytics.
* API/model credentials tetap server-side.
* Setiap paid AI operation tunduk pada server-enforced quota dan concurrency controls sebelum public access.
* Duplicate taps, reconnects, navigation, dan retries tidak boleh menyebabkan uncontrolled duplicate provider jobs.
* Late AI responses tidak boleh menimpa newer user selection.
* Image optimization hanya diperbolehkan jika resulting image tetap cukup untuk reliable analysis dan preview. Exact quality threshold harus divalidasi dalam design/testing, bukan ditebak di PRD.

## 8. Success measures

Numerical targets sengaja tidak dibuat sebelum pilot data tersedia.

| Metric                        | Definisi                                                                                                                                                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Completion rate               | Unique flows yang berhasil membuat barber brief / unique flows dengan valid upload.                                                                                                                                                   |
| Recommendation selection rate | Unique flows yang memilih haircut / unique flows yang melihat recommendations.                                                                                                                                                        |
| Preview success rate          | Valid preview jobs completed / preview jobs started; pending dan failure causes dilaporkan terpisah.                                                                                                                                  |
| Save rate                     | Unique flows yang berhasil menyimpan haircut / unique flows yang membuat brief.                                                                                                                                                       |
| Barber usefulness             | Pengguna yang melaporkan bahwa brief membantu mengomunikasikan haircut / pengguna yang benar-benar menggunakan brief dengan barber.                                                                                                   |
| Repeat usage                  | Saved-haircut users yang mengonfirmasi menggunakan brief untuk kunjungan haircut berikutnya / eligible saved-haircut cohort selama defined observation window. Reopen events dilaporkan terpisah dan tidak membuktikan repeat visits. |
| Cost per completed flow       | Total AI provider cost yang dapat diatribusikan pada cohort, termasuk failed/retried attempts / completed flows dalam cohort tersebut.                                                                                                |

API success saja bukan user-outcome metric. Demo/sample flows harus diidentifikasi secara terpisah dari real-user flows agar simulated success tidak meningkatkan product metrics secara keliru.

Design validation juga harus mengamati unassisted flow completion, kemampuan membedakan original dari simulation, kemampuan memahami next action setelah failure, dan readability/usefulness brief pada phone. Catat test task, participant count, device, dan observed results; belum ada user-test scores atau conversion targets yang diklaim. Mobile width/touch-target expectations di Section 4 adalah acceptance gates, bukan business KPIs.

## 9. Penyelarasan AI Builder Cup 2026

**Historical source snapshot:** PRD v0.2 yang diberikan melaporkan verifikasi pada 19 September 2026. Revisi ini tidak melakukan re-verification terhadap external event rules. Pernyataan di bawah mempertahankan dated source record tersebut dan tidak boleh direpresentasikan sebagai verifikasi pada 21 September 2026.
**Public sources checked:**

* Official overview: https://aibuildercup.com/
* Official themes and judging page: https://aibuildercup.com/themes.html
* Previously referenced T&C Google document: tidak dapat diakses melalui current verification tool; catatan sebelumnya karena itu hanya dipertahankan sebagai **needs re-verification**, bukan dipromosikan sebagai newly verified facts.

### 9.1 Catatan public-rule yang dipertahankan dari source snapshot 19 September

Source PRD melaporkan planning assumptions berikut dari accessible pages pada saat itu:

* Cutback sesuai dengan **Retail & Commerce: Intelligent Customer and Business Experiences**, termasuk discovery dan personalization.
* Entry harus berupa functional prototype, bukan hanya pitch atau mockup.
* Current themes guidance mewajibkan Google AI models seperti Gemini/Gemma atau listed Google agentic platforms, dan deployment pada Google Cloud menggunakan Cloud Run atau Firebase.
* Submission guidance pada themes page meminta proposal/deck yang dikonversi menjadi PDF, functional deployed prototype, dan public video link berdurasi tiga menit yang menunjukkan solution.
* Themes page menyatakan submission materials, termasuk code, documentation, dan presentations, harus dalam English.
* Current judging weights yang ditampilkan secara publik adalah: Technical Merit & Gen AI Implementation 40%, Problem Alignment & Impact 25%, Innovation & Creativity 25%, User Experience & Solution Design 10%.
* Currently indexed official overview menyatakan team formation dari 1 September sampai 11 Oktober 2026, prototype building/submission dari 7 September sampai 18 Oktober 2026, finalist announcement pada 7 November, dan Demo Day di Singapore pada 4 Desember 2026.
* Currently indexed overview menyatakan teams berjumlah **2–4** orang dan students tidak eligible; participants berusia 21+ dan program menargetkan working professionals, entrepreneurs, dan startups di JAPAC.

### 9.2 Konflik official-source dan item yang belum diverifikasi

Jangan secara diam-diam menyelesaikan hal berikut sebagai fakta:

1. Cached official overview yang diambil selama verification masih memiliki wording lama **1–4 member**, sementara currently indexed overview menunjukkan **2–4**. Gunakan 2–4 sebagai current working rule, tetapi verifikasi participant dashboard dan latest T&C sebelum roster dianggap final.
2. Themes page memiliki category-specification subsection yang mencantumkan categories yang tidak konsisten dengan six main themes. Cutback harus tetap dipetakan ke Retail & Commerce kecuali actual submission form membutuhkan field lain, dalam hal tersebut gunakan dashboard sebagai final operational source.
3. Previous requirements baseline menyatakan public GitHub repository mandatory. Requirement tersebut tidak dapat diverifikasi ulang dari accessible official pages dalam pass ini. Pertahankan public-ready repo dalam submission plan, tetapi tandai mandatory status sebagai **needs verification**.
4. Previous baseline menyatakan freshness/originality restrictions untuk code dan assets berdasarkan T&C. Referenced T&C source tidak dapat diakses dalam pass ini. Jangan menyatakan old Cutback code/assets eligible hanya karena project dibangun ulang sebagai “V2”; verifikasi latest T&C atau dapatkan written organizer clarification sebelum memutuskan old assets mana yang boleh masuk submission.
5. Themes page menyatakan “3 minutes” untuk video. Jika team memilih internal target seperti 179 seconds, dokumentasikan sebagai safety margin, bukan official rule kecuali dashboard/T&C secara eksplisit menyatakan “under 3 minutes.”

### 9.3 Bukti yang harus disiapkan Cutback

Competition work harus menghasilkan evidence, bukan competition-only product bloat:

* **AI evidence:** tunjukkan real Google AI berpartisipasi secara meaningful dalam analysis/recommendation/preview sebagaimana berlaku; jangan presentasikan mocks sebagai live AI.
* **Deployment evidence:** working event deployment pada service yang diizinkan oleh verified rules.
* **End-to-end demo:** tunjukkan smartphone flow dari upload melalui recommendation, selected preview, barber brief, save, dan reopen.
* **Barber-brief value:** demonstrasikan dengan jelas mengapa brief mengurangi ambiguity dibanding generic reference image atau verbal instruction.
* **Repeat value:** reopen saved haircut tanpa rerunning AI.
* **Repository:** pertahankan codebase agar reviewable dan safe for publication; verifikasi apakah public-repo submission mandatory sebelum final submission.
* **Video and deck:** demonstrasikan actual product dan architecture tanpa invented traction, impact, atau validation results.
* **Language:** siapkan submission-facing artifacts dalam English sementara internal working documents boleh tetap Indonesian.

## 10. Risiko produk dan keputusan terbuka

Hal berikut masih unresolved dan harus ditutup selama design, bukan ditebak saat implementation:

1. web/frontend framework dan backend framework;
2. monorepo vs separate frontend/backend repositories;
3. Google ADK version dan exact Google model(s);
4. image-generation model dan apakah competition-allowed Google path mendukung required identity-preserving preview quality;
5. API contracts dan structured-output schemas;
6. image upload normalization/compression limits dan quality validation criteria;
7. persistence mode untuk MVP: local device/browser vs authenticated account storage;
8. jika account storage dipilih, authentication dan ownership model;
9. photo/object storage, database, retention, deletion, dan backup behavior;
10. quotas, concurrency limits, dan test/demo budget;
11. job/retry/reconnect mechanism yang menjamin duplicate protection;
12. detailed customization tetap later scope; promotion ke MVP membutuhkan explicit scope revision;
13. apakah dan kapan old-photo reconstruction ditambahkan setelah current MVP;
14. final GCP deployment service dan topology;
15. event-specific unresolved items: team-size conflict, repo requirement, old-code/asset freshness, T&C details, dan exact submission-form requirements.

## 11. Tata kelola dokumen

* PRD ini mendefinisikan product direction, scope, delivery priority, success criteria, dan competition alignment.
* `cutback-requirements.md` mendefinisikan observable behavior dan acceptance criteria.
* `design.md` akan mendefinisikan technical implementation decisions.
* `tasks.md` akan memecah design dan requirements menjadi executable work.
* Product behavior changes membutuhkan PRD/requirements review sebelum code di-merge jika perubahan mengubah agreed behavior.
* Manual code edits diperbolehkan; spec-driven berarti implemented behavior dan authoritative spec harus disinkronkan, bukan berarti code tidak boleh pernah diedit langsung.
* Historical source files tetap menjadi read-only references dan tidak boleh diperlakukan sebagai concurrent active baselines.

### 11.1 Sinkronisasi lanjutan

1. Pilih canonical requirements document dan rekonsiliasi version/provenance-nya dengan PRD ini; pertahankan existing FR/AC identifiers agar traceable.
2. Terjemahkan AL-01–AL-10 menjadi behavioral acceptance criteria dan design decisions. Catat final preference semantics, preview states, persistence messaging, dan repeat presentation.
3. Perbarui design specification menggunakan existing prototype sebagai evidence; pertahankan unresolved states sebagai explicit work.
4. Periksa repository dan bedakan implemented, simulated, unverified, dan missing behavior sebelum membuat implementation tasks.
5. Perbarui README references dan milestone wording setelah corresponding changes dibuat. Revisi PRD ini tidak mengklaim artifacts lain tersebut telah diperbarui.

### 11.2 Batas bukti revisi

Sumber: `cutback-prd(6).md` v0.2 yang dipilih pengguna; sepuluh prototype screenshots yang diberikan; `README(1).md` yang sebelumnya dibaca; frame-audit findings dan user direction dalam conversation ini. Reference video tidak dianalisis ulang. Tidak dilakukan code execution tests, live prototype interaction, provider verification, Figma edits, atau event-rule re-verification untuk pembaruan PRD ini.
