const charRange = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  number: "0123456789",
  symbol: "!@#$%^&*_+?",
};

const output = document.getElementById("output");
const length = document.getElementById("length");
const checkboxes = document.querySelectorAll('input[type="checkbox"]');
const generateButton = document.getElementById("generate");
const copyButton = document.getElementById("copy");

copyButton.addEventListener("click", copyPassword);

generateButton.addEventListener("click", generate);

length.addEventListener("change", generate);

checkboxes.forEach((checkbox) => checkbox.addEventListener("change", generate));

function generate() {
  const len = parseInt(length.value);

  if (len < parseInt(length.min) || len > parseInt(length.max)) {
    output.textContent = "Độ dài không hợp lệ";
    return;
  }

  const checkedOptions = [...checkboxes].filter((checkbox) => checkbox.checked);

  checkedOptions.map(
    (checkbox) => (checkbox.disabled = 1 === checkedOptions.length)
  );

  output.textContent = createPassword(len, checkedOptions);
}

function createPassword(len, options) {
  let charList = "";

  options.forEach((option) => (charList += charRange[option.id]));

  let password = "";
  for (let i = 0; i < len; i++) {
    password += charList.charAt(Math.floor(Math.random() * charList.length));
  }

  return password;
}

function copyPassword() {
  const password = output.textContent;
  if (!password) return;

  navigator.clipboard.writeText(password).then(() => {
    alert("Mật khẩu đã được sao chép");
  });
}

generate();
