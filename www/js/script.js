/*jshint forin:true, noarg:true, noempty:true, bitwise:true, undef:true, curly:true, browser:true, devel:true, jquery:true, maxerr:50 */

(function(document){
    var Module = (function(){

        var base = {
            map : false,
            radar_images : [],
            config : { 
                image_interval : 15,
                total : 20
            }
        };
        
        /**
         * Use the browser to find the current location, and centre the map there if it works
         */
        function get_location()
        {
            //  This closure has access to the callback
            function callback_closure( pos )
            {
                // Make a latLng object and send it to the map
                var centre = new google.maps.LatLng( pos.coords.latitude, pos.coords.longitude );
                base.map.setCenter( centre );
            }
            
            function position_error( error )
            {
                console.log( 'Cant find location' );
            }
            
            navigator.geolocation.getCurrentPosition(
                callback_closure, // call back function
                position_error,
                {
                    'enableHighAccuracy':true,
                    'timeout':10000,
                    'maximumAge':0
                }
            );
        }    
        
        /**
         * Create google maps object and bind it to the DOM element,
         * Attach a listner to get_location when the tiles are loaded.
         */
        function init_map()
        {
            // Only run if google api is loaded
            if( typeof(google) === undefined || typeof(google.maps.MapTypeId) === undefined ){
                return false;
            }
            
            //Google maps defaults
            var myOptions = {
                zoom: 6,
                mapTypeId: google.maps.MapTypeId.TERRAIN,
                disableDefaultUI: true,
                disableDoubleClickZoom: true,
                center : new google.maps.LatLng( 54,-3 )
            };
            
            base.map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
            
            
            google.maps.event.addListenerOnce( base.map, 'tilesloaded', get_location );
            
        }
        
        
        /**
         * Populate base.radar_images with a set of URLs to radar images to overlay
         */
        function get_overlay_urls( callback )
        {
            var 
                time = new Date();
                time.setUTCHours(time.getUTCHours()-6);
            var    
                hour = time.getUTCHours(), 
                minute = 0, 
                year = time.getUTCFullYear(), 
                day = time.getUTCDate(), 
                month = time.getUTCMonth() + 1,
                
                m,
                /**
                 * Closure with access to time variables, returns URL to each radar image for the time
                 */
                url = function (){
                    m = minute;
                    // Zeropad minute
                    if( minute === 0 ){
                        m = '0' + minute.toString();
                    }
                    
                    
                    
                    
                    
                    return 'http://www.raintoday.co.uk/radarimage2/' + year + '-' + month + '-' + day + '%20' + hour + ':' + m + ':00/48.73445537176822/59.4115481664237/-12.06298828125/4.19677734375/740/834/g3fvn1s3mrrrgi9vszkwofksqik11igl/rainfall/obs/radar.radar';
                },
                imageBounds = new google.maps.LatLngBounds(
                        new google.maps.LatLng(48.73445537176822,-12.06298828125),
                        new google.maps.LatLng(59.4115481664237,4.19677734375)
                ),
                i = base.config.total,
                preloaded = 0;
                
                
            // use initial values of time
            base.start_time = {
                h : hour,
                m : minute
            }

            // Loop thru a number of times to create URLs for
            while( i -- ){
                
                
                
                // Start minutes again for the next hour
                if( minute < ( 60 - base.config.image_interval ) ){
                    minute = minute + base.config.image_interval;
                }else{
                    minute = 0;
                    if( hour < 23 ){
                        hour ++;
                    }else{
                        hour = 0;
                        day ++;
                    }
                }
                
                if( hour < 0 ){
                    hour = hour + 24;
                }
                
                console.log( 'h: ' + hour + ' min: ' + minute + ' date: ' + day + ' month: ' + month);
                // Make an overlay object for each time interval
                var img = document.createElement('img');
                    
                img.src = url();  
                
                var overlay = new google.maps.GroundOverlay(
                        img.src,
                        imageBounds
                )
                                    
                    // Store overlay in global object to loop thru
                base.radar_images.push( {key : i, overlay : overlay, time : {h : hour, m : m}} );


                img.onload = function(){
                    preloaded ++;
                    
                    // If theyre all loaded, run the callback
                    if( preloaded >= 20 ){
                        if( 'function' === typeof(callback) ){
                            callback();
                        }
                    }
                }
            
                
                
            }
            
            
            
            
            
        }

        /**
         * Run add_overlay periodically, incrementing the key reference each time to loop though base.radar_images
         */
        function do_overlays(){
            
            var key = 0,
                len = base.radar_images.length;
            
            function add_overlay()
            {
                $('#progress li:eq(' + key + ')').css({'background':'#333'});
                // Increment or reset
                if( key == len ){
                    key = 0;
                    $('#progress li').css({'background':'#fff'});
                }else{
                    key ++;
                }
                
                if( !base.radar_images[key] ){
                        return false;
                    }
                    
                
                (function clearOverlays() {
                  if (base.radar_images) {
                    var len = base.radar_images.length;
                    while( len -- ) {
                      base.radar_images[len].overlay.setMap(null);
                    }
                  }
                })();
                
                var overlay = base.radar_images[key].overlay || false,
                    time = base.radar_images[key].time || false;
                    
                
                try{
                    overlay.setMap( base.map );
                }catch(e){
                }
                
                
                
                $( '#time' ).html( time.h + ':' + time.m );
                
                
                
                
                
                
                
            }
            
            window.setInterval( add_overlay, 800 );
            
        }
        
        
        
        
        
        

        return {
            init : function(){
                init_map();

                get_overlay_urls(function(){
                    var min = base.start_time.m;
                    if( min === 0 ){
                            min = '0' + min.toString();
                        }
                    $( '#time' ).html( 'Starting: ' + base.start_time.h + ':' + min );

                    do_overlays();
                });
                
                
                
                while( base.config.total -- ){
                    $('#progress').append( $('<li>') );    
                }
            }
        };    
    })();
    
//    document.Module = Module;
    
    $( document ).ready( Module.init );
    
    
})(document);