import SimpleParallax from "simple-parallax-js/vanilla";

      let image = document.getElementById("header");
      new simpleParallax(image, { scale: 1.7, delay: 2, orientation: 'down' });
      AOS.init({
        duration: 0.2,
        once: true,
        easing: 'ease-in-out',
        offset: 100
      });