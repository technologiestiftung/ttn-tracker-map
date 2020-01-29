import $ from 'jquery';

(document).ready(function() {
  //your code here

  $(window).load(function() {
    // makes sure the whole site is loaded
    // preloader
    $('#status').fadeOut(); // will first fade out the loading animation
    $('#preloader')
      .delay(550)
      .fadeOut('slow'); // will fade out the white DIV that covers the website.
    $('body') // will fade in the body.
      .delay(550)
      .css({
        overflow: 'visible',
      });

    //  isotope
    var $container = $('.portfolio_container');
    $container.isotope({
      filter: '*',
    });

    $('.portfolio_filter a').click(function() {
      $('.portfolio_filter .active').removeClass('active');
      $(this).addClass('active');

      var selector = $(this).attr('data-filter');
      $container.isotope({
        filter: selector,
        animationOptions: {
          duration: 500,
          animationEngine: 'jquery',
        },
      });
      return false;
    });
  });
});
