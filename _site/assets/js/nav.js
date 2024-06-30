var pathArray = window.location.pathname.split('/');
console.log(pathArray[1]);

var navElements = document.querySelectorAll('a.page-link');

//looping through each anchor element
navElements.forEach(function(element){
    console.log(element.innerHTML);
    if (pathArray[1] == element.innerHTML){
        console.log("match");
        element.classList.add("active");
    }
});
