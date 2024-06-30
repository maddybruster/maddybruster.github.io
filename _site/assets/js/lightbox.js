

window.onload = function() {

    /// get an array of all images loaded in the feed 
    var imageNodes = document.querySelectorAll(".container .feed-container .feed-image-container img");

    /// set a unique # ID for each image 
    for (var i=0; i<imageNodes.length; i++) {  

            imageNodes.forEach( el => {
                el.setAttribute("id", [i++]);
                });
    }

   /// on click, see if image is one of elementsFromPoint
    document.addEventListener("mousedown", event => {

        /// if the modal already exists, do nothing  
        if (document.body.getElementsByClassName('modal').length > 0) {

        }
       
        /// else if the modal does not exist yet, open the modal 
        else {
        
        let elements = document.elementsFromPoint(event.clientX, event.clientY);
        elements.forEach(elementSearch);

        /// search through elements, if element is class feed-image
        function elementSearch (element) {
            if (element.classList.contains("feed-image")) {
                console.log(element.id);
                ///add selected to class list for that image 
                element.classList.add("selected");
                /// save the image src as a variable 
                var src = element.src;

                //creating the modal
                let imgModal = (src) => {
                const modal = document.createElement("div");
                modal.setAttribute("class", "modal");
                //add the modal to the main section or the parent element
                document.querySelector(".container").append(modal);
                 //adding image to modal
                const newImage = document.createElement("img");
                newImage.setAttribute("src", src);
                modal.append(newImage)


                //close function
                modal.onclick = () => {
                modal.remove();
                };

                };


                imgModal(src);


            }
            }  
            
        }
    });



}