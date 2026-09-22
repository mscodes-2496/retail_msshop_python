/* =========================================================
   WHATSAPP ORDERING STORE
   Complete store.js
========================================================= */

const KEY = "wa_order_cart_v1";
const MAX_QTY = 99;

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];


/* =========================================================
   LOAD + CLEAN CART
========================================================= */

let cart = {};




/* =========================================================
   SAVE CART
========================================================= */

function save() {

    localStorage.setItem(
        KEY,
        JSON.stringify(cart)
    );

    render();

}


/* =========================================================
   GET PRODUCT FROM BUTTON
========================================================= */

function productFromButton(button) {

    return {

        id:
            button.dataset.id,

        name:
            button.dataset.name,

        price:
            Number(button.dataset.price),

        unit:
            button.dataset.unit,

        quantity: 0

    };

}


/* =========================================================
   ADD PRODUCT
========================================================= */

function addProduct(button) {

    const id =
        button.dataset.id;


    if (!id) {

        console.error(
            "Product button has no data-id"
        );

        return;

    }


    /* Create cart item */

    if (!cart[id]) {

        cart[id] =
            productFromButton(button);

    }


    const currentQuantity =
        Number(cart[id].quantity) || 0;


    if (
        currentQuantity >= MAX_QTY
    ) {

        return;

    }


    cart[id].quantity =
        currentQuantity + 1;


    save();

}


/* =========================================================
   INCREASE PRODUCT
========================================================= */

function increaseProduct(id) {

    if (!cart[id]) {

        return;

    }


    const quantity =
        Number(cart[id].quantity) || 0;


    if (
        quantity >= MAX_QTY
    ) {

        return;

    }


    cart[id].quantity =
        quantity + 1;


    save();

}


/* =========================================================
   DECREASE PRODUCT
========================================================= */

function decreaseProduct(id) {

    if (!cart[id]) {

        return;

    }


    const quantity =
        Number(cart[id].quantity) || 0;


    if (
        quantity <= 1
    ) {

        delete cart[id];

    }
    else {

        cart[id].quantity =
            quantity - 1;

    }


    save();

}


/* =========================================================
   PRODUCT CARD BUTTONS
========================================================= */

function renderProductButtons() {

    $$(".product-action")
        .forEach(container => {

            const id =
                container.dataset.productAction;


            /*
             Find the original product information.

             These values are stored directly on
             product-action below when first loaded.
            */

            const item =
                cart[id];


            /* ==========================
               PRODUCT IS IN CART
            ========================== */

            if (
                item &&
                item.quantity > 0
            ) {

                container.innerHTML = `

                    <div class="product-qty">

                        <button
                            type="button"
                            class="product-minus"
                            data-id="${id}"
                            aria-label="Decrease quantity"
                        >
                            −
                        </button>

                        <span>
                            ${item.quantity}
                        </span>

                        <button
                            type="button"
                            class="product-plus"
                            data-id="${id}"
                            aria-label="Increase quantity"
                        >
                            +
                        </button>

                    </div>

                `;

                return;

            }


            /* ==========================
               PRODUCT NOT IN CART
            ========================== */

            const productData =
                productCatalogue[id];


            if (!productData) {

                return;

            }


            container.innerHTML = `

                <button
                    class="add"
                    type="button"

                    data-id="${escapeAttribute(
                        productData.id
                    )}"

                    data-name="${escapeAttribute(
                        productData.name
                    )}"

                    data-price="${productData.price}"

                    data-unit="${escapeAttribute(
                        productData.unit
                    )}"
                >
                    ADD
                </button>

            `;

        });

}


/* =========================================================
   PRODUCT CATALOGUE CACHE

   IMPORTANT:
   This lets us rebuild ADD buttons after quantity reaches 0.
========================================================= */

const productCatalogue = {};


function buildProductCatalogue() {

    $$(".product-action")
        .forEach(container => {

            const button =
                container.querySelector(".add");


            if (!button) {

                return;

            }


            const id =
                button.dataset.id;


            if (!id) {

                return;

            }


            productCatalogue[id] = {

                id:
                    id,

                name:
                    button.dataset.name,

                price:
                    Number(
                        button.dataset.price
                    ),

                unit:
                    button.dataset.unit

            };

        });

}


/* =========================================================
   EVENT DELEGATION

   This is the important fix.

   We DON'T attach click events directly to ADD buttons,
   because those buttons are dynamically replaced.

   Instead we listen at document level.
========================================================= */

document.addEventListener(
    "click",
    event => {

        /* --------------------------
           ADD
        -------------------------- */

        const addButton =
            event.target.closest(".add");


        if (addButton) {

            event.preventDefault();

            addProduct(addButton);

            return;

        }


        /* --------------------------
           PRODUCT +
        -------------------------- */

        const plusButton =
            event.target.closest(
                ".product-plus"
            );


        if (plusButton) {

            event.preventDefault();

            increaseProduct(
                plusButton.dataset.id
            );

            return;

        }


        /* --------------------------
           PRODUCT -
        -------------------------- */

        const minusButton =
            event.target.closest(
                ".product-minus"
            );


        if (minusButton) {

            event.preventDefault();

            decreaseProduct(
                minusButton.dataset.id
            );

            return;

        }


        /* --------------------------
           CART +
        -------------------------- */

        const cartPlus =
            event.target.closest(
                "[data-plus]"
            );


        if (cartPlus) {

            event.preventDefault();

            increaseProduct(
                cartPlus.dataset.plus
            );

            return;

        }


        /* --------------------------
           CART -
        -------------------------- */

        const cartMinus =
            event.target.closest(
                "[data-minus]"
            );


        if (cartMinus) {

            event.preventDefault();

            decreaseProduct(
                cartMinus.dataset.minus
            );

        }

    }
);


/* =========================================================
   RENDER CART
========================================================= */

function render() {

    const items =
        Object.values(cart);


    /* ==========================
       ITEM COUNT
    ========================== */

    const count =
        items.reduce(
            (total, item) => {

                return (
                    total +
                    Number(item.quantity)
                );

            },
            0
        );


    /* ==========================
       SUBTOTAL
    ========================== */

    const subtotal =
        items.reduce(
            (total, item) => {

                return (
                    total +
                    (
                        Number(item.price) *
                        Number(item.quantity)
                    )
                );

            },
            0
        );


    /* ==========================
       HEADER COUNT
    ========================== */

    if ($("#cartCount")) {

        $("#cartCount").textContent =
            count;

    }


    /* ==========================
       DRAWER COUNT
    ========================== */

    if ($("#drawerItemCount")) {

        $("#drawerItemCount")
            .textContent =
            count;

    }


    /* ==========================
       MOBILE CART
    ========================== */

    if ($("#mobileCartCount")) {

        $("#mobileCartCount")
            .textContent =
            `${count} ${
                count === 1
                    ? "item"
                    : "items"
            }`;

    }


    if ($("#mobileCartTotal")) {

        $("#mobileCartTotal")
            .textContent =
            `₹${subtotal.toFixed(2)}`;

    }


    /* ==========================
       BILL
    ========================== */

    if ($("#cartSubtotal")) {

        $("#cartSubtotal")
            .textContent =
            `₹${subtotal.toFixed(2)}`;

    }


    if ($("#estimatedTotal")) {

        $("#estimatedTotal")
            .textContent =
            `₹${subtotal.toFixed(2)}`;

    }


    if ($("#checkoutTotal")) {

        $("#checkoutTotal")
            .textContent =
            `₹${subtotal.toFixed(2)}`;

    }


    /* ==========================
       MOBILE CART BAR
    ========================== */

    const mobileCartBar =
        $("#mobileCartBar");


    if (mobileCartBar) {

        if (count > 0) {

            mobileCartBar
                .classList
                .remove("hidden");

        }
        else {

            mobileCartBar
                .classList
                .add("hidden");

        }

    }


    /* ==========================
       CART ITEMS
    ========================== */

    const cartItems =
        $("#cartItems");


    if (cartItems) {

        if (
            items.length === 0
        ) {

            cartItems.innerHTML = `

                <div class="empty-cart">

                    <p>
                        Your cart is empty.
                    </p>

                </div>

            `;

        }
        else {

            cartItems.innerHTML =
                items
                    .map(item => {

                        const lineTotal =
                            Number(item.price) *
                            Number(item.quantity);


                        return `

                            <div class="cart-line">

                                <div
                                    class="cart-line-info"
                                >

                                    <b>
                                        ${escapeHtml(
                                            item.name
                                        )}
                                    </b>

                                    <small>

                                        ₹${Number(
                                            item.price
                                        ).toFixed(2)}

                                        /

                                        ${escapeHtml(
                                            item.unit
                                        )}

                                    </small>

                                    <div
                                        class="cart-line-price"
                                    >

                                        ₹${lineTotal.toFixed(2)}

                                    </div>

                                </div>


                                <div class="qty">

                                    <button
                                        type="button"
                                        data-minus="${escapeAttribute(
                                            item.id
                                        )}"
                                    >
                                        −
                                    </button>


                                    <span>
                                        ${item.quantity}
                                    </span>


                                    <button
                                        type="button"
                                        data-plus="${escapeAttribute(
                                            item.id
                                        )}"
                                    >
                                        +
                                    </button>

                                </div>

                            </div>

                        `;

                    })
                    .join("");

        }

    }


    /*
     Keep product cards synchronized
     with cart.
    */

    renderProductButtons();

}


/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


function escapeAttribute(value) {

    return escapeHtml(value);

}


/* =========================================================
   OPEN CART
========================================================= */

function openCart() {

    const drawer =
        $("#drawer");

    const overlay =
        $("#cartOverlay");


    if (drawer) {

        drawer.classList
            .add("open");

    }


    if (overlay) {

        overlay.classList
            .add("open");

    }


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   CLOSE CART
========================================================= */

function closeCart() {

    const drawer =
        $("#drawer");

    const overlay =
        $("#cartOverlay");


    if (drawer) {

        drawer.classList
            .remove("open");

    }


    if (overlay) {

        overlay.classList
            .remove("open");

    }


    document.body.style.overflow =
        "";

}


/* =========================================================
   CART OPEN / CLOSE BUTTONS
========================================================= */

if ($("#cartBtn")) {

    $("#cartBtn").onclick =
        openCart;

}


if ($("#viewCartBtn")) {

    $("#viewCartBtn").onclick =
        openCart;

}


if ($("#closeCart")) {

    $("#closeCart").onclick =
        closeCart;

}


if ($("#cartOverlay")) {

    $("#cartOverlay").onclick =
        closeCart;

}


if ($("#addMoreItems")) {

    $("#addMoreItems").onclick =
        closeCart;

}


/* ESC key */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeCart();

        }

    }
);


/* =========================================================
   DELIVERY / PICKUP
========================================================= */

function updateAddressVisibility() {

    const fulfillment =
        $("#fulfillment");

    const addressWrap =
        $("#addressWrap");

    const addressInput =
        $("#address");


    if (
        !fulfillment ||
        !addressWrap
    ) {

        return;

    }


    const delivery =
        fulfillment.value ===
        "delivery";


    addressWrap.style.display =
        delivery
            ? "block"
            : "none";


    /*
     Require address only for delivery.
    */

    if (addressInput) {

        addressInput.required =
            delivery;

    }

}


if ($("#fulfillment")) {

    $("#fulfillment").onchange =
        updateAddressVisibility;

}


/* =========================================================
   SEARCH + CATEGORY FILTER
========================================================= */

function filterProducts() {

    const search =
        $("#search");


    const query =
        search
            ? search.value
                .trim()
                .toLowerCase()
            : "";


    const activeChip =
        $(".chip.active");


    const category =
        activeChip
            ? String(
                activeChip.dataset.category ||
                "all"
            ).toLowerCase()
            : "all";


    $$(".product")
        .forEach(product => {

            const name =
                String(
                    product.dataset.name ||
                    ""
                ).toLowerCase();


            const productCategory =
                String(
                    product.dataset.category ||
                    ""
                ).toLowerCase();


            const searchMatches =
                name.includes(query);


            const categoryMatches =
                category === "all" ||
                productCategory === category;


            product.style.display =
                searchMatches &&
                categoryMatches

                    ? ""

                    : "none";

        });

}


if ($("#search")) {

    $("#search").oninput =
        filterProducts;

}


$$(".chip")
    .forEach(chip => {

        chip.onclick =
            () => {

                $$(".chip")
                    .forEach(item => {

                        item.classList
                            .remove(
                                "active"
                            );

                    });


                chip.classList
                    .add(
                        "active"
                    );


                filterProducts();

            };

    });


/* =========================================================
   CHECKOUT
========================================================= */

if ($("#checkoutForm")) {

    $("#checkoutForm")
        .onsubmit =
        async event => {

            event.preventDefault();


            const errorBox =
                $("#formError");


            if (errorBox) {

                errorBox.textContent =
                    "";

            }


            /* ==========================
               BUILD ORDER ITEMS
            ========================== */

            const items =
                Object.values(cart)
                    .filter(
                        item =>
                            Number(
                                item.quantity
                            ) > 0
                    )
                    .map(
                        item => ({

                            id:
                                item.id,

                            quantity:
                                Number(
                                    item.quantity
                                )

                        })
                    );


            if (
                items.length === 0
            ) {

                if (errorBox) {

                    errorBox.textContent =
                        "Add at least one item.";

                }

                return;

            }


            /* ==========================
               FORM DATA
            ========================== */

            const formData =
                new FormData(
                    event.target
                );


            const payload =
                Object.fromEntries(
                    formData.entries()
                );


            payload.items =
                items;


            /* ==========================
               SUBMIT BUTTON
            ========================== */

            const submitButton =
                event.target
                    .querySelector(
                        'button[type="submit"]'
                    );


            const originalButton =
                submitButton
                    ? submitButton.innerHTML
                    : "";


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.innerHTML =
                    "Creating order...";

            }


            try {

                /* ==========================
                   CREATE ORDER
                ========================== */

                const response =
                    await fetch(

                        "/api/orders",

                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    payload
                                )

                        }

                    );


                let data;


                try {

                    data =
                        await response.json();

                }
                catch {

                    throw new Error(
                        "Server returned an invalid response."
                    );

                }


                if (
                    !response.ok
                ) {

                    throw new Error(

                        data.error ||
                        data.detail ||
                        "Could not create order"

                    );

                }


                /* ==========================
                   CLEAR CART
                ========================== */

                cart = {};

                localStorage.removeItem(
                    KEY
                );

                render();


                /* ==========================
                   CONFIRMATION PAGE
                ========================== */

                const total =
                    Number(
                        data.total || 0
                    );


                location.href =

                    `/order/${encodeURIComponent(
                        data.order_id
                    )}` +

                    `?short=${encodeURIComponent(
                        data.short_id || ""
                    )}` +

                    `&total=${encodeURIComponent(
                        total.toFixed(2)
                    )}` +

                    `&wa=${encodeURIComponent(
                        data.whatsapp_url || ""
                    )}`;

            }
            catch (error) {

                console.error(
                    "Checkout error:",
                    error
                );


                if (errorBox) {

                    errorBox.textContent =
                        error.message;

                }


                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.innerHTML =
                        originalButton;

                }

            }

        };

}


/* =========================================================
   INITIALIZE
========================================================= */

/*
 IMPORTANT:
 Build catalogue BEFORE renderProductButtons()
 replaces the ADD buttons.
*/

buildProductCatalogue();


/*
 Setup delivery field.
*/

updateAddressVisibility();


/*
 Render initial cart.
*/

render();