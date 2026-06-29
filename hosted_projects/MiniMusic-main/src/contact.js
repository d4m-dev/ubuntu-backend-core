(function () {
  function getQueryStringParams() {
    const params = {};
    const url = new URL(document.currentScript.src);
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }

  const allowedButtonColors = [
    "black",
    "blue",
    "green",
    "orange",
    "red",
    "violet",
    "white",
    "yellow",
  ];

  function validateButtonColor(color) {
    return allowedButtonColors.includes(color.toLowerCase()) ? color : "black";
  }

  const queryParams = getQueryStringParams();
  const linkColor = queryParams.linkColor || "#fff";
  const textColor = queryParams.textColor || "#fff";
  const buttonColor = validateButtonColor(queryParams.buttonColor || "black");

  const style = document.createElement("style");
  style.textContent = `.footer {
      margin-top: auto;
      padding-block: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    .footer > * {
      text-align: center;
      line-height: 1.25rem;
      font-size: .875rem;
    }
    .footer a {
      color: ${linkColor};
      margin-inline: 0.5rem;
    }
    .footer img {
      height: 32px;
      width: 114px;
    }
    @media (min-width: 768px) {
      .footer img {
        height: 38px;
        width: 135px;
      }
    }`;
  document.head.appendChild(style);

  const footer = document.createElement("footer");
  footer.classList.add("footer");

  const links = [
    { href: "https://github.com/d4m-dev", text: "Github" },
    { href: "https://youtube.com/@d4m-dev", text: "Youtube" },
    { href: "https://www.tiktok.com/@d4m_dev", text: "Tiktok" },
  ];

  const socialLinksDiv = document.createElement("div");

  links.forEach((link) => {
    const a = document.createElement("a");
    a.href = link.href;
    a.target = "_blank";
    a.textContent = link.text;
    socialLinksDiv.appendChild(a);
  });

  footer.appendChild(socialLinksDiv);

  const span = document.createElement("span");
  span.style.color = textColor;
  span.innerText =
    "Crafted with ❤️ by d4m-dev. \n If my work brings you joy, consider a coffee! ☕️";
  footer.appendChild(span);

  const coffeeLink = document.createElement("a");
  coffeeLink.href = "https://www.buymeacoffee.com/d4m-dev";
  coffeeLink.target = "_blank";

  const coffeeImg = document.createElement("img");
  coffeeImg.src = `https://cdn.buymeacoffee.com/buttons/v2/default-${buttonColor}.png`;
  coffeeImg.alt = "Buy Me A Coffee";
  coffeeLink.appendChild(coffeeImg);

  footer.appendChild(coffeeLink);

  document.body.appendChild(footer);
})();
