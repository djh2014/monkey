$(function(){
    /**
     * The categories in top menu (base on super fish menu)
     * @see: every page
     **/
    $("ul.sf-menu").superfish({
        animation: {
            height:'show'
        },   // slide-down effect without fade-in
        delay: 0 // 1.2 second delay on mouseout
    });

    /**
     * Make the icon change when hover on top menu
     * @see: every page
     **/
    $("ul.nav li.main-menu-element").hover(
        function() {
            $li = $(this);
            if(!$li.hasClass('active')){
                $li.find('a').eq(0).find('i[class^="icon-"]').addClass('icon-white');
            }
        },
        function() {
            $li = $(this);
            if(!$li.hasClass('active')){
                $(this).find('a').eq(0).find('i[class^="icon-"]').removeClass('icon-white');
            }
        }
        );

    $('ul.nav li.active').each(function(){
        $(this).find('i[class^="icon-"]').addClass('icon-white');
    });

    /**
     * Search box in top menu
     * @see: every page
     **/
    var str = {
        getLimitSize:function(){
            if($.browser.msie){
                return 7;
            }
            return 37;
        },
        excerpt:function(encoded){
            limit = str.getLimitSize();
            if(encoded.length > limit){
                encoded = encoded.substring(0, limit);
            }
            return encoded;
        }
    }
    $('#search-in-content li').click(function(){
        $('#search-in-content').find('.active').removeClass('active');
        $this = $(this);
        $this.addClass('active');
        $value = $this.attr('data-value');
        $('#search-in-category').val($value);

        $label = $this.find('a').html();
        $label = str.excerpt($label);
        $('#label-search-in').html($label);
    });


    /**
     * The main slider
     * @see: index.html
     **/
    if($('#ei-slider').eislideshow != undefined){
        $('#ei-slider').eislideshow({
            animation			: 'center',
            autoplay			: true,
            slideshow_interval	: 3000,
            titlesFactor		: 0
        });
    }

    /**
     * Refine your search
     * @see: category.html
     **/

    //multi choice
    $('.refine-search-multichoice > li').bind('click', {}, function(){
        $this = $(this);
        if($this.hasClass('active')){
            $this.removeClass('active');
        }else{
            $this.addClass('active');
        }
    });

    //one choice
    $('.refine-search-onechoice > li').bind('click', {}, function(){
        $this = $(this);
        $this.parent().find('.active').removeClass('active');
        $this.addClass('active');
    });

    /**
     * Increase/Decrease quantity in detail
     * @see: detail.html
     */
    $('#qty-plus').bind('click', {}, function(){
        $qty = $('#item_qty').html();
        $qty = parseInt($qty);
        $qty++;
        $('#item_qty').html($qty);
    });

    $('#qty-minus').bind('click', {}, function(){
        $qty = $('#item_qty').html();
        $qty = parseInt($qty);
        $qty--;
        if($qty<=0){
            $qty = 1;
        }
        $('#item_qty').html($qty);
    });


    /**
     * show/hide review form
     * @see: detail.html
     */
    $('#writeReview').bind('click', {}, function(){
        $('#reviewForm').toggle();
    });
});