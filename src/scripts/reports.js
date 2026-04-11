
// validate the form, make sure all input fields are not empty
// and make sure all input fields are not negative
function validateForm(input1, input2, input3) {
    if (!input3.value || !input2.value || !input1.value) {
        alert("Please fill out all fields on either the buy or sell form");
        return false;
    }
    if (input3.value < 0 || input2.value < 0 || input1.value < 0) {
        alert("No negative inputs are allowed in the form!");
        return false;
    }

    return true;
}


function main() {

    // get form element
    const form = document.getElementById("form");

    // add the form event listener
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        // get which button was clicked
        const buttonClicked = event.submitter.id;

        // validate form for buy button
        if (buttonClicked === "buy-button") {

            const sharesInput = document.getElementById("sharesInput");
            const limitInput = document.getElementById("limitInput");
            const takeProfitInput = document.getElementById("takeProfitInput");


            if (validateForm(sharesInput, limitInput, takeProfitInput)) {
                alert("Buy form submitted successfully!");
            }

        // validate form for sell button
        } else if (buttonClicked === "sell-button") {

            const leverageInput = document.getElementById("leverageInput");
            const tbd = document.getElementById("tbd");
            const stopLossInput = document.getElementById("stopLossInput");

            if (validateForm(leverageInput, tbd, stopLossInput)) {
                alert("sell form submitted correctly!")
            }
        }
    });

}

main();