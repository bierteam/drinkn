$(function () {
  $('.btn-6')
    .on('mouseenter', function (e) {
      var parentOffset = $(this).offset()

      var relX = e.pageX - parentOffset.left

      var relY = e.pageY - parentOffset.top
      $(this).find('span').css({ top: relY, left: relX })
    })
    .on('mouseout', function (e) {
      var parentOffset = $(this).offset()

      var relX = e.pageX - parentOffset.left

      var relY = e.pageY - parentOffset.top
    	$(this).find('span').css({ top: relY, left: relX })
    })
  $('[href=#]').click(function () { return false })
})
