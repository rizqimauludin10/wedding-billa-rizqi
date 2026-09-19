// ============================================================
// APPS SCRIPT URL — Ganti dengan URL deployment lo
// ============================================================
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwB2V_jDquV9BfvNIDppQ-hXWZs19GidgOz9Cz8IGp8sPGdw2HHq3986m0yAcpkvnNR/exec";

/* =============================
   ANGKA JALAN — dipakai bareng buat angka tanggal Event & total
   Wishes, makanya ditaruh di luar DOMContentLoaded biar bisa diakses
   dari initWishes() juga (fungsi terpisah di bawah).
============================= */
function animateDateCounter(el, target, duration = 1200) {
  const start = performance.now();
  const startValue = target > 0 ? 1 : 0;
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    // easeOutQuad — mulai cepat, pelan-pelan berhenti di angka akhir
    const eased = 1 - (1 - progress) * (1 - progress);
    el.textContent = Math.round(startValue + eased * (target - startValue));
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = target;
    }
  }
  requestAnimationFrame(tick);
}

document.addEventListener("DOMContentLoaded", function () {
  /* =============================
     AMBIL NAMA TAMU DARI URL
     Contoh: ?to=Nabilla+Eko+Putri
  ============================= */
  const urlParams = new URLSearchParams(window.location.search);
  const guestName = urlParams.get("to");
  const guestEl = document.getElementById("guestName");
  if (guestName && guestEl) {
    guestEl.innerText = guestName;
  }

  /* =============================
     COVER BUTTON
  ============================= */
  const openBtn = document.getElementById("openBtn");
  const cover = document.getElementById("cover");
  const bgVideo = document.getElementById("bgVideo");
  const mainContent = document.getElementById("mainContent");

  if (openBtn && cover && bgVideo && mainContent) {
    openBtn.addEventListener("click", function () {
      document.body.style.overflowY = "auto";

      cover.classList.add("fade-out");
      bgVideo.classList.add("show-video");
      bgVideo.play().catch(() => {});

      setTimeout(() => {
        cover.style.display = "none";
        mainContent.style.display = "block";

        // Double rAF biar opacity transition jalan setelah display:block
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            mainContent.classList.add("show-content");
          });
        });
      }, 1200);
    });
  }

  // ===== SEMBUNYIIN TOMBOL MUSIK SEMENTARA — quoteSection & closingSection =====
  const musicPlayerEl = document.getElementById("musicPlayer");
  const quoteSectionEl = document.getElementById("quoteSection");
  const closingSectionEl = document.getElementById("closingSection");
  const musicHideTargets = [quoteSectionEl, closingSectionEl].filter(Boolean);

  if (musicPlayerEl && musicHideTargets.length) {
    // FIX: nyimpen SEMUA section yang lagi kelihatan bareng, bukan cuma
    // baca status 1 section terakhir yang diproses — biar gak ke-timpa
    // salah pas 2 section sama-sama ngasih status bareng.
    const intersectingHideTargets = new Set();

    const musicAutoHideObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            intersectingHideTargets.add(entry.target);
          } else {
            intersectingHideTargets.delete(entry.target);
          }
        });

        if (intersectingHideTargets.size > 0) {
          musicPlayerEl.classList.add("auto-hide");
        } else {
          musicPlayerEl.classList.remove("auto-hide");
        }
      },
      { threshold: 0.3 },
    );

    if (openBtn) {
      openBtn.addEventListener("click", () => {
        setTimeout(() => {
          musicHideTargets.forEach((el) => musicAutoHideObserver.observe(el));
        }, 1300);
      });
    }
  }

  // ===== SCROLL HINT — quoteSection =====
  // Hilang permanen begitu tamu scroll pertama kali, gak nongol lagi
  // walau balik ke atas (cuma reset kalau halaman di-refresh, soalnya
  // state-nya murni variable JS biasa, bukan disimpan di localStorage).
  const scrollHint = document.getElementById("scrollHint");
  if (scrollHint) {
    function hideScrollHint() {
      scrollHint.classList.add("hidden");
      window.removeEventListener("scroll", hideScrollHint);
    }
    window.addEventListener("scroll", hideScrollHint, { passive: true });
  }

  // ===== LOADING STATE — GOOGLE MAPS =====
  const venueMapsFrame = document.getElementById("venueMapsFrame");
  const venueMapsLoading = document.getElementById("venueMapsLoading");
  if (venueMapsFrame && venueMapsLoading) {
    venueMapsFrame.addEventListener("load", () => {
      venueMapsLoading.classList.add("hidden");
    });
  }

  /* =============================
     COVER ENTRANCE ANIMATION
  ============================= */
  const coverElements = document.querySelectorAll(
    ".logo-wrapper, .couple-wrapper, .guest-wrapper, .button-wrapper",
  );

  coverElements.forEach((el, index) => {
    setTimeout(() => {
      el.classList.add("cover-show");
    }, index * 200);
  });

  /* =============================
     INTERSECTION OBSERVER
     Semua scroll animation dalam satu observer.

     CLEANUP: sebelumnya tiap section didaftarkan lewat
     "if (x) observer.observe(x)" satu-satu (9 baris berulang) —
     digabung jadi satu array + loop biar lebih ringkas dan gampang
     nambah section baru nanti.

     PERFORMANCE: setelah sebuah elemen kelihatan & dikasih class
     "show", elemen itu di-unobserve. Animasi ini kan cuma sekali
     jalan (muncul saat pertama masuk viewport, gak pernah balik ke
     kondisi awal), jadi gak perlu terus dipantau observer selama
     sisa hidup halaman — mengurangi kerja observer tiap kali user
     scroll di halaman yang panjang ini.
  ============================= */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  const revealTargets = [
    document.querySelector("#quoteSection .container"),
    document.querySelector(".journey-title"),
    ...document.querySelectorAll(".story-item"),
    document.getElementById("brideSection"),
    document.getElementById("groomSection"),
    document.getElementById("countdownSection"),
    document.getElementById("eventSection"),
    // Akad & Resepsi sekarang "halaman" sendiri-sendiri — masing²
    // di-observe terpisah biar fade-in-nya jalan pas user scroll
    // ke tiap halaman, bukan sekaligus pas judul "The Event" muncul.
    ...document.querySelectorAll(".event-page"),
    document.getElementById("venueSection"),
    document.getElementById("rsvpSection"),
    document.getElementById("wishesSection"),
    // thanksSection sengaja gak didaftarin di sini — dia dapet
    // observer sendiri di bawah dengan threshold beda (lihat
    // thanksObserver).
    document.getElementById("gallerySection"),
    document.getElementById("closingSection"),
  ].filter(Boolean); // buang null kalau ada elemen yang gak ketemu

  revealTargets.forEach((el) => observer.observe(el));

  /* =============================
     OBSERVER TERPISAH — ANGKA TANGGAL EVENT
     Angka gede "15" di section Event dianimasikan jalan dari 1
     sampai berhenti di angka aslinya (dibaca dari textContent di
     HTML, jadi kalau tanggalnya lain, ini otomatis nyesuain — gak
     perlu ubah angka target manual di JS).
  ============================= */
  const eventDateObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.textContent.trim(), 10);
          if (!isNaN(target)) animateDateCounter(el, target);
          eventDateObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.5 },
  );

  const eventDateMainEl = document.querySelector(".event-date-main");
  if (eventDateMainEl) eventDateObserver.observe(eventDateMainEl);

  /* =============================
     OBSERVER TERPISAH — THANKS SECTION
     Section lain pakai threshold 0.15 (15% kelihatan langsung
     trigger). Khusus Thanks, animasinya baru nyala pas 40% section
     ini udah ke-scroll — biar gak "ketinggalan" muncul terlalu awal
     sebelum user beneran sampai di section-nya.
  ============================= */
  const thanksObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          thanksObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 },
  );

  const thanksSectionEl = document.getElementById("thanksSection");
  if (thanksSectionEl) thanksObserver.observe(thanksSectionEl);

  /* =============================
     SLIDER — Bride & Groom
     Reusable function

     PERFORMANCE: skip kerja kalau tab lagi di-background
     (document.hidden). Sebelumnya interval ini terus jalan ganti
     slide walau user pindah tab / minimize browser — buang-buang
     CPU & baterai buat animasi yang gak keliatan siapa-siapa.
  ============================= */
  function startSlider(selector, interval) {
    const slides = document.querySelectorAll(selector);
    if (!slides.length) return;
    let index = 0;
    // Toggle arah zoom — gantian tiap kali foto berpindah, biar gak
    // monoton selalu zoom-in doang.
    let zoomIn = true;

    function triggerZoom(el) {
      el.classList.remove("zooming-in", "zooming-out");
      void el.offsetWidth; // paksa reflow biar animasi bisa restart
      el.classList.add(zoomIn ? "zooming-in" : "zooming-out");
      zoomIn = !zoomIn;
    }

    triggerZoom(slides[0]);

    setInterval(() => {
      if (document.hidden) return;
      slides[index].classList.remove("active");
      index = (index + 1) % slides.length;
      slides[index].classList.add("active");
      triggerZoom(slides[index]);
    }, interval);
  }

  startSlider(".bride-slide", 4000);
  startSlider(".groom-slide", 4500);
  // Interval lebih panjang (6 detik) dari Bride/Groom (4-4.5 detik),
  // digabung sama transisi 3 detik di CSS — hasilnya slideshow yang
  // beneran berasa pelan & tenang, bukan buru-buru gonta-ganti foto.
  startSlider(".thanks-slide", 4000);

  /* =============================
     RSVP CHAT
  ============================= */
  initRSVP();

  /* =============================
     WISHES
  ============================= */
  initWishes();

  /* =============================
     GALLERY
  ============================= */
  initGallery();

  /* =============================
     COUNTDOWN TIMER
  ============================= */
  const weddingDate = new Date("2026-10-15T08:00:00+07:00");

  function updateCountdown() {
    const diff = weddingDate - new Date();
    if (diff <= 0) {
      ["cdDays", "cdHours", "cdMinutes", "cdSeconds"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = "00";
      });
      return;
    }
    const pad = (n) => String(Math.floor(n)).padStart(2, "0");
    const setEl = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      const newText = pad(val);
      // ANIMASI: cuma trigger "tick" kalau angkanya BENERAN berubah —
      // biar Hours/Minutes/Days gak ikut ke-animasi tiap detik padahal
      // cuma Seconds yang biasanya berubah tiap tick.
      if (el.textContent !== newText) {
        el.textContent = newText;
        el.classList.remove("tick");
        void el.offsetWidth; // paksa reflow biar animasi bisa restart
        el.classList.add("tick");
      }
    };
    setEl("cdDays", Math.floor(diff / 86400000));
    setEl("cdHours", Math.floor((diff % 86400000) / 3600000));
    setEl("cdMinutes", Math.floor((diff % 3600000) / 60000));
    setEl("cdSeconds", Math.floor((diff % 60000) / 1000));
  }

  updateCountdown();

  // PERFORMANCE: skip tick countdown kalau tab di-background,
  // lalu refresh sekali begitu tab aktif lagi biar angkanya gak
  // basi pas user balik.
  setInterval(() => {
    if (!document.hidden) updateCountdown();
  }, 1000);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) updateCountdown();
  });
}); // end DOMContentLoaded

/* =============================
   RSVP FUNCTION
============================= */
function initRSVP() {
  const messagesEl = document.getElementById("rsvpMessages");
  const inputArea = document.getElementById("rsvpInputArea");
  const inputEl = document.getElementById("rsvpInput");
  const sendBtn = document.getElementById("rsvpSendBtn");

  if (!messagesEl || !inputArea || !inputEl || !sendBtn) return;

  let userData = { hadir: "", nama: "", jumlah: "", ucapan: "" };
  let currentCallback = null;

  // Pasang event listener sekali saja
  sendBtn.addEventListener("click", handleSend);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSend();
  });

  function handleSend() {
    const val = inputEl.value.trim();
    if (!val || !currentCallback) return;
    stopChatPulse();
    inputEl.disabled = true;
    sendBtn.disabled = true;
    inputArea.classList.add("hidden");
    const cb = currentCallback;
    currentCallback = null;
    cb(val);
  }

  inputArea.classList.add("hidden");

  // Mulai percakapan
  const chatBox = document.querySelector(".rsvp-chat-box");
  function stopChatPulse() {
    if (chatBox) chatBox.classList.add("engaged");
  }

  // FIX: percakapan sekarang di-gate — baru mulai pas section RSVP
  // beneran kelihatan di layar, bukan otomatis pas halaman dibuka.
  function startConversation() {
    showTyping();
    setTimeout(() => {
      removeTyping();
      addBubbleLeft("Halo! Senang sekali kamu sudah membuka undangan kami 🥰");
    }, 900);

    setTimeout(() => {
      addBubbleLeft("Apakah kamu bisa hadir di hari istimewa kami?");
      addChoices(
        [
          { emoji: "🥂", text: "Insya Allah hadir!" },
          { emoji: "💔", text: "Maaf, berhalangan hadir" },
        ],
        handleHadir,
      );
    }, 1900);
  }

  const rsvpSectionEl = document.getElementById("rsvpSection");
  const rsvpStartObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          startConversation();
          rsvpStartObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 },
  );
  if (rsvpSectionEl) rsvpStartObserver.observe(rsvpSectionEl);

  function handleHadir(pilihan) {
    userData.hadir = pilihan === 0 ? "Hadir" : "Tidak Hadir";
    addBubbleRight(
      pilihan === 0 ? "Insya Allah hadir! 🎉" : "Maaf, berhalangan hadir 🙏",
    );
    setTimeout(() => {
      addBubbleLeft(
        pilihan === 0
          ? "Alhamdulillah, senang sekali! 🤍"
          : "Tidak apa-apa, terima kasih sudah memberitahu kami 🤍",
      );
    }, 600);
    setTimeout(() => {
      addBubbleLeft("Boleh tau nama kamu?");
      showInput("Ketik nama kamu...", handleNama, "text");
    }, 1400);
  }

  function handleNama(nama) {
    userData.nama = nama;
    addBubbleRight(nama);
    setTimeout(() => addBubbleLeft(`Hai ${nama}! 😊`), 600);
    if (userData.hadir === "Hadir") {
      setTimeout(() => {
        addBubbleLeft("Berapa orang yang akan hadir? (termasuk kamu)");
        showInput("Contoh: 2", handleJumlah, "number");
      }, 1400);
    } else {
      setTimeout(() => {
        addBubbleLeft("Titip ucapan dan doa untuk kami yuk! 🤍");
        showInput("Tulis ucapan kamu...", handleUcapan, "text");
      }, 1400);
    }
  }

  function handleJumlah(jumlah) {
    if (isNaN(jumlah) || Number(jumlah) < 1) {
      addBubbleLeft("Hmm, sepertinya bukan angka yang valid. Coba lagi ya 😊");
      showInput("Contoh: 2", handleJumlah, "number");
      return;
    }
    userData.jumlah = jumlah;
    addBubbleRight(`${jumlah} orang`);
    setTimeout(
      () =>
        addBubbleLeft(
          `Siap! Kami akan menyiapkan tempat untuk ${jumlah} orang 🥰`,
        ),
      600,
    );
    setTimeout(() => {
      addBubbleLeft("Titip ucapan dan doa untuk kami yuk! 🤍");
      showInput("Tulis ucapan kamu...", handleUcapan, "text");
    }, 1400);
  }

  function handleUcapan(ucapan) {
    userData.ucapan = ucapan;
    addBubbleRight(ucapan);
    inputArea.classList.add("hidden");
    setTimeout(
      () =>
        addBubbleLeft(
          "Terima kasih banyak! Ucapanmu sangat berarti untuk kami 🤍",
        ),
      600,
    );
    setTimeout(() => {
      addBubbleLeft("Sedang menyimpan konfirmasimu...");
      showTyping();
      kirimKeSheets();
    }, 1400);
  }

  function kirimKeSheets() {
    const payload = {
      nama: userData.nama,
      hadir: userData.hadir,
      jumlah: userData.jumlah || "-",
      ucapan: userData.ucapan,
      waktu: new Date().toLocaleString("id-ID"),
    };

    fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(() => {
        removeTyping();
        tampilkanSukses();
      })
      .catch(() => {
        removeTyping();
        tampilkanSukses();
      });
  }

  function tampilkanSukses() {
    inputArea.classList.add("hidden");
    setTimeout(() => {
      const sukses = document.createElement("div");
      sukses.className = "rsvp-success";
      sukses.innerHTML = `
        <div class="rsvp-success-icon">🎊</div>
        <div class="rsvp-success-title">Terima kasih, ${userData.nama}!</div>
        <div class="rsvp-success-desc">
          Konfirmasimu sudah kami terima.<br>
          ${
            userData.hadir === "Hadir"
              ? "Sampai jumpa di hari istimewa kami! 🥂"
              : "Doa dan dukunganmu sangat berarti untuk kami. 🤍"
          }
        </div>
      `;
      messagesEl.appendChild(sukses);
      scrollToBottom();
    }, 600);
  }

  function addBubbleLeft(text) {
    const wrap = document.createElement("div");
    wrap.className = "rsvp-bubble-left";
    wrap.innerHTML = `<div class="rsvp-bubble-avatar">💌</div><div class="rsvp-bubble">${text}</div>`;
    messagesEl.appendChild(wrap);
    scrollToBottom();
  }

  function addBubbleRight(text) {
    const wrap = document.createElement("div");
    wrap.className = "rsvp-bubble-right";
    wrap.innerHTML = `<div class="rsvp-bubble">${text}</div>`;
    messagesEl.appendChild(wrap);
    scrollToBottom();
  }

  function addChoices(choices, callback) {
    inputArea.classList.add("hidden");
    const wrap = document.createElement("div");
    wrap.className = "rsvp-choices";
    choices.forEach((c, i) => {
      const btn = document.createElement("button");
      btn.className = "rsvp-choice-btn";
      btn.innerHTML = `${c.emoji} &nbsp;${c.text}`;
      btn.addEventListener("click", () => {
        stopChatPulse();
        wrap
          .querySelectorAll(".rsvp-choice-btn")
          .forEach((b) => (b.disabled = true));
        callback(i);
      });
      wrap.appendChild(btn);
    });
    messagesEl.appendChild(wrap);
    scrollToBottom();
  }

  function showInput(placeholder, callback, type = "text") {
    currentCallback = callback;
    inputEl.placeholder = placeholder;
    inputEl.type = type;
    inputEl.value = "";
    inputEl.disabled = false;
    sendBtn.disabled = false;
    inputArea.classList.remove("hidden");
    setTimeout(() => inputEl.focus(), 100);
    // FIX: scroll ke input saat keyboard muncul di HP
    setTimeout(
      () => inputEl.scrollIntoView({ behavior: "smooth", block: "center" }),
      300,
    );
  }

  function showTyping() {
    const el = document.createElement("div");
    el.className = "rsvp-typing";
    el.id = "rsvpTyping";
    el.innerHTML = `
      <div class="rsvp-bubble-avatar">💌</div>
      <div class="rsvp-typing-dots">
        <div class="rsvp-dot"></div>
        <div class="rsvp-dot"></div>
        <div class="rsvp-dot"></div>
      </div>
    `;
    messagesEl.appendChild(el);
    scrollToBottom();
  }

  function removeTyping() {
    const el = document.getElementById("rsvpTyping");
    if (el) el.remove();
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
}

/* =============================
   WISHES FUNCTION
============================= */
function initWishes() {
  const masonry = document.getElementById("wishesMasonry");
  const loadMore = document.getElementById("wishesLoadMore");
  const loading = document.getElementById("wishesLoading");
  const empty = document.getElementById("wishesEmpty");
  const errorBox = document.getElementById("wishesError");
  const retryBtn = document.getElementById("wishesRetryBtn");
  const countNumberEl = document.getElementById("wishesCountNumber");

  if (!masonry || !loadMore || !loading || !empty || !errorBox || !retryBtn)
    return;

  const PER_PAGE = 5;
  let allWishes = [];
  let currentIndex = 0;

  // FIX: logic fetch dibungkus jadi fungsi sendiri (loadWishes), biar
  // bisa dipanggil ulang dari tombol "Muat Ulang" tanpa perlu refresh
  // seluruh halaman.
  function loadWishes() {
    loading.classList.remove("hidden");
    empty.classList.add("hidden");
    errorBox.classList.add("hidden");
    loadMore.classList.add("hidden");
    masonry.innerHTML = "";
    currentIndex = 0;
    if (countNumberEl) countNumberEl.textContent = "0";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    fetch(APPS_SCRIPT_URL, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        clearTimeout(timeoutId);
        loading.classList.add("hidden");
        allWishes = data.filter(
          (row) => row.ucapan && row.ucapan.trim() !== "",
        );
        if (countNumberEl)
          animateDateCounter(countNumberEl, allWishes.length, 1000);
        if (allWishes.length === 0) {
          empty.classList.remove("hidden");
          return;
        }
        renderWishes();
        updateLoadMoreBtn();
      })
      .catch(() => {
        clearTimeout(timeoutId);
        loading.classList.add("hidden");
        errorBox.classList.remove("hidden");
        if (countNumberEl) countNumberEl.textContent = "-";
      });
  }

  retryBtn.addEventListener("click", loadWishes);

  loadWishes();

  function renderWishes() {
    const batch = allWishes.slice(currentIndex, currentIndex + PER_PAGE);
    batch.forEach((wish, i) => {
      const card = document.createElement("div");
      card.className = "wishes-card";
      card.style.animationDelay = `${i * 0.08}s`;
      const isHadir = wish.hadir === "Hadir";
      const statusClass = isHadir ? "hadir" : "tidak";
      const statusText = isHadir ? "Hadir" : "Berhalangan";
      card.innerHTML = `
        <div class="wishes-card-header">
          <div class="wishes-card-name">${escapeHTML(wish.nama)}</div>
          <span class="wishes-card-status ${statusClass}">${statusText}</span>
        </div>
        <div class="wishes-card-text">${escapeHTML(wish.ucapan)}</div>
      `;
      masonry.appendChild(card);
    });
    currentIndex += batch.length;
  }

  function updateLoadMoreBtn() {
    if (currentIndex >= allWishes.length) {
      loadMore.classList.add("hidden");
    } else {
      loadMore.classList.remove("hidden");
    }
  }

  loadMore.addEventListener("click", () => {
    renderWishes();
    updateLoadMoreBtn();
  });

  function escapeHTML(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

/* =============================
   GALLERY FUNCTION
============================= */
function initGallery() {
  const items = document.querySelectorAll(".editorial-item");
  // ANIMASI: kasih custom property --i ke tiap foto berdasarkan
  // data-index-nya, dipakai CSS buat ngitung delay stagger

  items.forEach((item) => {
    item.style.setProperty("--i", item.dataset.index % 3);
  });

  // FIX: tiap foto dikasih observer sendiri-sendiri, biar animasinya
  // beneran jalan PAS foto itu masuk layar — bukan numpang trigger 1x
  // dari section (yang keburu "kelar main" duluan sebelum user scroll
  // sampai foto-foto di baris bawah).
  const photoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          photoObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 },
  );

  items.forEach((item) => photoObserver.observe(item));
  const lightbox = document.getElementById("galleryLightbox");
  const lbImg = document.getElementById("lbImg");
  const lbClose = document.getElementById("lbClose");
  const lbPrev = document.getElementById("lbPrev");
  const lbNext = document.getElementById("lbNext");
  const lbCounter = document.getElementById("lbCounter");

  if (!items.length || !lightbox) return;

  // NOTE: .src di sini selalu ngasih URL absolut yang udah di-resolve,
  // gak peduli foto grid-nya udah kebuka (loading="lazy") atau belum —
  // jadi aman dipakai buat lightbox tanpa mesti nunggu foto grid
  // ke-load duluan.
  const srcs = Array.from(items)
    .sort((a, b) => parseInt(a.dataset.index) - parseInt(b.dataset.index))
    .map((item) => item.querySelector("img").src);

  const total = srcs.length;
  let current = 0;

  function openLightbox(index) {
    resetImageZoom();
    current = index;
    lbImg.src = srcs[current];
    lbCounter.textContent = `${current + 1} / ${total}`;
    lightbox.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("active");
    // FIX: reset overflow dengan benar biar scroll tidak hilang
    document.body.style.overflow = "auto";
    document.body.style.overflowX = "hidden";
  }

  function prevPhoto() {
    resetImageZoom();
    current = (current - 1 + total) % total;
    lbImg.src = srcs[current];
    lbCounter.textContent = `${current + 1} / ${total}`;
  }

  function nextPhoto() {
    resetImageZoom();
    current = (current + 1) % total;
    lbImg.src = srcs[current];
    lbCounter.textContent = `${current + 1} / ${total}`;
  }

  items.forEach((item) => {
    item.addEventListener("click", () =>
      openLightbox(parseInt(item.dataset.index)),
    );
  });

  lbClose.addEventListener("click", closeLightbox);
  lbPrev.addEventListener("click", prevPhoto);
  lbNext.addEventListener("click", nextPhoto);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;
    if (e.key === "ArrowLeft") prevPhoto();
    if (e.key === "ArrowRight") nextPhoto();
    if (e.key === "Escape") closeLightbox();
  });

  // Swipe support untuk mobile
  // ===== ZOOM, PAN & SWIPE buat foto di lightbox =====
  let touchStartX = 0;
  let touchEndX = 0;
  let isMultiTouch = false;
  let currentScale = 1;
  let currentTranslateX = 0;
  let currentTranslateY = 0;
  let startDistance = 0;
  let startScale = 1;
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let lastTapTime = 0;

  function getDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function applyImageTransform() {
    lbImg.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px) scale(${currentScale})`;
  }

  function resetImageZoom() {
    currentScale = 1;
    currentTranslateX = 0;
    currentTranslateY = 0;
    lbImg.style.transform = "";
  }

  lightbox.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 2) {
        // Mulai PINCH — 2 jari
        isMultiTouch = true;
        startDistance = getDistance(e.touches);
        startScale = currentScale;
      } else if (e.touches.length === 1) {
        isMultiTouch = false;
        if (currentScale > 1) {
          // Foto lagi di-zoom → 1 jari buat GESER (pan), bukan ganti foto
          isPanning = true;
          panStartX = e.touches[0].clientX - currentTranslateX;
          panStartY = e.touches[0].clientY - currentTranslateY;
        } else {
          touchStartX = e.changedTouches[0].screenX;
        }

        // Double-tap buat toggle zoom cepat
        const now = Date.now();
        if (now - lastTapTime < 300) {
          if (currentScale > 1) {
            resetImageZoom();
          } else {
            currentScale = 2;
            applyImageTransform();
          }
        }
        lastTapTime = now;
      }
    },
    { passive: true },
  );

  lightbox.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length === 2) {
        isMultiTouch = true;
        const newDistance = getDistance(e.touches);
        const scaleChange = newDistance / startDistance;
        currentScale = Math.min(Math.max(startScale * scaleChange, 1), 4);
        applyImageTransform();
      } else if (e.touches.length === 1 && isPanning) {
        currentTranslateX = e.touches[0].clientX - panStartX;
        currentTranslateY = e.touches[0].clientY - panStartY;
        applyImageTransform();
      }
    },
    { passive: true },
  );

  lightbox.addEventListener("touchend", (e) => {
    if (e.touches.length === 0) isPanning = false;

    if (isMultiTouch) {
      isMultiTouch = false;
      if (currentScale <= 1.05) resetImageZoom();
      return;
    }

    if (currentScale > 1) return; // lagi di-zoom, swipe jangan ganti foto

    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextPhoto();
      else prevPhoto();
    }
  });
}

initMusicPlayer();

function initMusicPlayer() {
  const music = document.getElementById("bgMusic");
  const player = document.getElementById("musicPlayer");
  const btn = document.getElementById("musicBtn");
  const icon = document.getElementById("musicIcon");

  if (!music || !player || !btn || !icon) return;

  let isPlaying = false;
  let fadeInterval = null;

  // ===== TAMPILKAN PLAYER SETELAH COVER DIBUKA =====
  const openBtnEl = document.getElementById("openBtn");
  if (openBtnEl) {
    openBtnEl.addEventListener("click", () => {
      setTimeout(() => {
        player.classList.add("visible");
        playWithFade();
      }, 200);
    });
  }

  // ===== TOGGLE PLAY / PAUSE =====
  btn.addEventListener("click", () => {
    if (isPlaying) {
      pauseWithFade();
    } else {
      playWithFade();
    }
  });

  // ===== PLAY DENGAN FADE IN =====
  function playWithFade() {
    clearInterval(fadeInterval);

    music.volume = 0;
    music.play().catch(() => {});

    isPlaying = true;
    player.classList.add("playing");
    icon.className = "bi bi-pause-fill";

    let steps = 0;
    fadeInterval = setInterval(() => {
      steps++;
      if (music.volume < 0.65) {
        music.volume = Math.min(music.volume + 0.05, 0.7);
      }
      if (music.volume >= 0.65 || steps >= 14) {
        clearInterval(fadeInterval);
      }
    }, 100);
  }

  // ===== PAUSE DENGAN FADE OUT =====
  function pauseWithFade() {
    clearInterval(fadeInterval);

    let steps = 0;
    fadeInterval = setInterval(() => {
      steps++;
      if (music.volume > 0.05) {
        music.volume = Math.max(music.volume - 0.05, 0);
      }
      if (music.volume <= 0.05 || steps >= 14) {
        music.volume = 0;
        music.pause();
        clearInterval(fadeInterval);

        isPlaying = false;
        player.classList.remove("playing");
        icon.className = "bi bi-music-note-beamed";
      }
    }, 100);
  }
}

// ===== SIMPAN KE KALENDER (AKAD & RESEPSI) =====
const addToCalendarBtn = document.getElementById("addToCalendarBtn");
if (addToCalendarBtn) {
  addToCalendarBtn.addEventListener("click", () => {
    const title = encodeURIComponent("The Wedding of Billa & Rizqi");
    const details = encodeURIComponent(
      "Tanpa mengurangi rasa hormat, kami mengundang Anda untuk hadir di perayaan pernikahan Billa & Rizqi.\n\n- Akad Nikah: 08.00 WIB\n- Resepsi Nikah: 11.00 - 14.00 WIB",
    );
    const location = encodeURIComponent(
      "Stay.vie Hotel, Lantai 7 (Rooftop), Surabaya",
    );
    // 15 Oktober 2026 jam 08:00 WIB - 14:00 WIB (01:00 - 07:00 UTC)
    const dates = "20261015T010000Z/20261015T070000Z";

    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;

    window.open(gcalUrl, "_blank");
  });
}
