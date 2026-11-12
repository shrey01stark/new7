console.log("script loaded");

const cursor = document.querySelector('.glowing-cursor');

if (cursor) {
  document.addEventListener('mousemove', (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  }, { passive: true });
}

if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

/* ================= PRELOADER ================= */

window.addEventListener("load", function() {
  const preloader = document.getElementById("preloader");
  if (!preloader) return;

  window.setTimeout(() => {
    preloader.classList.add("loader-hidden");
    document.body.style.overflow = "auto";
  }, 1000);
});


/* ================= MOBILE MENU ================= */

document.addEventListener('DOMContentLoaded', () => {

  const menuTrigger = document.getElementById('menuTrigger');
  const mobHeader = document.querySelector('.mob-header');

  if (menuTrigger && mobHeader) {
    menuTrigger.addEventListener('click', () => {
      const isOpen = menuTrigger.classList.toggle('active');
      mobHeader.classList.toggle('open', isOpen);
      menuTrigger.setAttribute('aria-expanded', String(isOpen));
    });
  }

  const mobLinks = document.querySelectorAll('.mob-a');
  mobLinks.forEach(link => {
    link.addEventListener('click', () => {
      menuTrigger?.classList.remove('active');
      mobHeader?.classList.remove('open');
      menuTrigger?.setAttribute('aria-expanded', 'false');
    });
  });


  /* ================= HEADER SCROLL ANIMATION ================= */

  const header = document.querySelector('header');
  if (header && window.gsap && window.ScrollTrigger) {
    const showAnim = gsap.from(header, {
      yPercent: -120, paused: true, duration: 0.3
    }).progress(1);

    ScrollTrigger.create({
      start: "top top", end: 99999,
      onUpdate: (self) => self.direction === -1 ? showAnim.play() : showAnim.reverse()
    });
  }


  /* ================= MARQUEE DIRECTION TOGGLE ================= */

  const control = document.getElementById("direction-toggle");
  const marquees = document.querySelectorAll(".marquee");
  const wrapper = document.querySelector(".wrapper");

  if (control) {
    control.addEventListener("click", () => {
      control.classList.toggle("toggle--vertical");
      wrapper?.classList.toggle("wrapper--vertical");
      [...marquees].forEach((marquee) =>
        marquee.classList.toggle("marquee--vertical")
      );
    });
  }


  /* ================= TEAM CAROUSEL (FINAL WORKING VERSION) ================= */
/* ================= TEAM CAROUSEL (FINAL STABLE VERSION) ================= */

  const team = [
    {
      img: "./assets/img/divisha.png",
      quote: "Meticulous perfectionist always two steps ahead, double-checking every detail to ensure 180DC runs flawlessly end to end.",
      role: "President",
      name: "Divisha Gupta"
    },
    {
      img: "./assets/img/sam.png",
      quote: "Calm, mature, and effortlessly chill leader who stays composed under pressure and turns tense situations into ease.",
      role: "Vice-President",
      name: "Samridhi Dobriyal"
    },
    {
      img: "./assets/img/bhu.png",
      quote: "Warm, approachable, and universally loved, they embody the spirit of 180DC and make every room brighter.",
      role: "General Secretary",
      name: "Bhupesh Falwaria"
    },
    {
      img: "./assets/img/avish.png",
      quote: "Insightful and dependable advisor, combining experience, clarity, and a steady presence to help 180DC navigate bigger decisions.",
      role: "Advisory",
      name: "Avish Katiyar"
    },
          
    {
      img: "./assets/img/mur.png",
      quote: "Strategic and composed, bringing seasoned perspective, sharp judgment, and thoughtful guidance whenever the organisation needs direction.",
      role: "Advisory",
      name: "Raaghav Murada"
    },
    {
      img: "./assets/img/par.png",
      quote: "Strong domain knowledge and valuable connections, ensuring smooth execution and scalable organisational growth.",
      role: "Client Acquisition Director",
      name: "Parissha Tyagi"
    },
    {
      img: "./assets/img/gad.png",
      quote: "Confident relationship-builder who turns conversations into opportunities, bringing persistence, professionalism, and a sharp instinct for client needs.",
      role: "Client Acquisition Director",
      name: "Raghav Gadhyan"
    },
    
    {
      img: "./assets/img/ahu.png",
      quote: "Unpredictably creative yet reliable, bringing bold ideas, punctual execution, and relentless commitment until every task is complete.",
      role: "Consulting Director",
      name: "Gauri Ahuja"
    },
    {
      img: "./assets/img/shrey.png",
      quote: "The knowledgeable consultant with thoughtful voice. Shrey's always ready with constructive insights, balancing logic, clarity, and genuine care.",
      role: "Consulting Director",
      name: "Shreyansh Tiwari"
    },
    {
      img: "./assets/img/das.png",
      quote: "Quiet yet confident, building instant client trust through professionalism, warmth, and a consistently positive presence.",
      role: "Consulting Director",
      name: "Aditya Dasgupta"
    },
    
    {
      img: "./assets/img/man.png",
      quote: "Energetic problem-solver who keeps the moving parts aligned, turning operational challenges into smooth execution with precision.",
      role: "Operations Director",
      name: "Aayush Mandal"
    },
    {
      img: "./assets/img/neer.png",
      quote: "Calm and systematic, keeping teams organised, deadlines visible, and execution moving forward without unnecessary friction.",
      role: "Operations Director",
      name: "Neeraj Sharma"
    },
    {
      img: "./assets/img/raj.png",
      quote: "Reliable and detail-oriented, bringing structure to complex workflows while ensuring every operational commitment is followed through.",
      role: "Operations Director",
      name: "Ananya Raj"
    },
    {
      img: "./assets/img/gar.png",
      quote: "Creative and trend-aware, bringing fresh ideas, sharp instincts, and consistent energy to make 180DC impossible to overlook.",
      role: "Marketing Director",
      name: "Garvit Anand"
    },
    {
      img: "./assets/img/div.png",
      quote: "Bold communicator with a strong eye for storytelling, turning ideas into engaging campaigns that strengthen 180DC's presence.",
      role: "Marketing Director",
      name: "Divyansh Kumar"
    }
  ];

  let index = 0;
  let interval;

  const img   = document.getElementById("teamImg");
  const quote = document.getElementById("teamQuote");
  const role  = document.getElementById("teamRole");
  const name  = document.getElementById("teamName");
  const box   = document.querySelector(".core-text");
  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");
  const dotsBox = document.getElementById("dots");

  /* RUN ONLY IF CAROUSEL EXISTS */
  if (img && quote && role && name && box && dotsBox && nextBtn && prevBtn) {

    /* CREATE DOTS */
    team.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.addEventListener("click", () => {
        index = i;
        updateMember();
        resetAutoSlide();
      });
      dotsBox.appendChild(dot);
    });

    const dots = document.querySelectorAll(".dots span");

    /* UPDATE FUNCTION */
    function updateMember() {
      box.classList.add("hide");

      setTimeout(() => {
        img.src = team[index].img;
        quote.textContent = team[index].quote;
        role.textContent = team[index].role;
        name.textContent = team[index].name;

        dots.forEach(dot => dot.classList.remove("active"));
        dots[index].classList.add("active");

        box.classList.remove("hide");
      }, 300);
    }

    /* BUTTONS */
    nextBtn.addEventListener("click", () => {
      index = (index + 1) % team.length;
      updateMember();
      resetAutoSlide();
    });

    prevBtn.addEventListener("click", () => {
      index = (index - 1 + team.length) % team.length;
      updateMember();
      resetAutoSlide();
    });

    /* AUTO SLIDE */
    function startAutoSlide() {
      interval = setInterval(() => {
        index = (index + 1) % team.length;
        updateMember();
      }, 4000);
    }

    function resetAutoSlide() {
      clearInterval(interval);
      startAutoSlide();
    }

    /* INIT */
    updateMember();
    startAutoSlide();
  }

}); 


document.addEventListener("DOMContentLoaded", () => {
  const projWrap = document.getElementById("projWrap");
  const projNextBtn = document.getElementById("projNextBtn");

  if (!projWrap || !projNextBtn) {
    console.log("projWrap or button not found");
    return;
  }

  projNextBtn.addEventListener("click", () => {
    const firstBox = projWrap.querySelector(".box");
    const gap = 32; // 2rem
    const scrollAmount = firstBox.offsetWidth + gap;

    projWrap.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    });
  });
});



const servicesData = [
  {
    num: "1.",
    title: "Business Strategy & Growth",
    desc: "We collaborate with organizations to design structured, data-informed strategies that clarify long-term direction, refine value propositions, and unlock sustainable growth while strengthening brand positioning and stakeholder engagement across evolving markets",
    img: "./assets/img/1 Image.webp",
    tags: ["Branding Strategy", "Social Media Optimization", "Engagement Strategy"]
  },
  {
    num: "2.",
    title: "Market & Competitor Research",
    desc: "We conduct comprehensive research to analyze markets, understand customers, and benchmark competitors, helping organizations make evidence-based decisions that improve offerings, identify opportunities, and strengthen competitive advantages within rapidly changing industry landscapes.",
    img: "./assets/img/2 Image.webp",
    tags: ["Customer Surveys", "Market Analysis", "Industry Reports"]
  },
  {
    num: "3.",
    title: "Financial & Profitability Analysis",
    desc: "We assist organizations in improving product development cycles and operational processes by optimizing supply chains, enhancing team management systems, and guiding product-market fit, thereby increasing efficiency, reducing waste, and improving service delivery standards.",
    img: "./assets/img/3 Image.webp",
    tags: ["Pricing & Launch Strategy", "Prototyping & MVP Guidance"]
  },
  {
    num: "4.",
    title: "Product & Operational Optimization",
    desc: "We assist organizations in improving product development cycles and operational processes by optimizing supply chains, enhancing team management systems, and guiding product-market fit, thereby increasing efficiency, reducing waste, and improving service delivery standards.",
    img: "./assets/img/4 Image.webp",
    tags: ["Cost Benefit Analysis"]
  },
  {
    num: "5.",
    title: "Fundraising & Partnership Development",
    desc: "We help organizations build fundraising capacity and outreach pipelines by developing compelling pitch materials, identifying grant opportunities, and connecting with relevant stakeholders, ultimately strengthening financial sustainability and strategic partnerships for long-term growth.",
    img: "./assets/img/5 Image.webp",
    tags: ["Lead Generation", "Fundraising Strategies"]
  },
  {
    num: "6.",
    title: "Impact & Sustainability Consulting",
    desc: "We enable purpose-driven organizations to measure outcomes, maximize social value, and adopt sustainability practices through structured impact frameworks, performance indicators, and strategic guidance tailored to mission alignment and long-term societal benefit.",
    img: "./assets/img/6 Image.webp",
    tags: ["Sustainibility Consulting","Impact Maximization Strategy"]
  }
];

const container = document.getElementById("servicesContainer");

if (container) servicesData.forEach((service, index) => {
  const block = document.createElement("div");
  block.classList.add("service-grid");

  // alternate layout: even = normal, odd = reverse
  if (index % 2 !== 0) {
    block.classList.add("reverse");
  }

  block.innerHTML = `
    <img src="${service.img}" alt="${service.title}">
    <div class="service-grid-text">
      <div class="num">${service.num}</div>
      <h1>${service.title}</h1>
      <p>${service.desc}</p>
      <div class="tags">
        ${service.tags.map(tag => `<div class="tag-item glass-card">${tag}</div>`).join("")}
      </div>
    </div>
  `;

  container.appendChild(block);
});


if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll(".service-grid").forEach(grid => observer.observe(grid));
} else {
  document.querySelectorAll(".service-grid").forEach(grid => grid.classList.add("show"));
}

const stagger = document.querySelector(".stagger-meet");

if (stagger && "IntersectionObserver" in window) {
  const staggerObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        stagger.classList.add("show");
        staggerObserver.unobserve(stagger);
      }
    });
  }, { threshold: 0.3 });
  staggerObserver.observe(stagger);
} else if (stagger) {
  stagger.classList.add("show");
}

const counters = document.querySelectorAll(".count-up");

const counterObserver = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    const el = entry.target;

    // Extract number + suffix (like +)
    const fullText = el.textContent.trim();
    const number = parseInt(fullText.replace(/\D/g, ""), 10);
    const suffix = fullText.replace(/[0-9]/g, "");

    const duration = 1000;
    const startTime = performance.now();

    function animateCount(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.floor(progress * number);

      el.textContent = value + suffix;

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        el.textContent = number + suffix;
      }
    }

    el.textContent = "0" + suffix;
    requestAnimationFrame(animateCount);
  });
}, {
  threshold: 0.6
}) : null;

counters.forEach(counter => {
  if (counterObserver) counterObserver.observe(counter);
});

