const shoppingList = document.querySelector(".shopping-list");
const shoppingForm = document.querySelector(".shopping-form");
const filterButtons = document.querySelectorAll("[data-filter]");
const clearButtons = document.querySelectorAll("[data-clear]");

function saveItems() {
  const listItems = shoppingList.querySelectorAll("li");

  const shoppingItems = [];
  listItems.forEach(function (listItem) {
    const id = listItem.getAttribute("data-id");
    const name = listItem.querySelector(".item-name").textContent;
    const completed = listItem.hasAttribute("data-completed");

    shoppingItems.push({ id, name, completed });
  });

  localStorage.setItem("shoppingItems", JSON.stringify(shoppingItems));
}

function loadItems() {
  const shoppingItems = JSON.parse(localStorage.getItem("shoppingItems")) || [];

  shoppingList.innerHTML = "";

  shoppingItems.forEach(function (shoppingItem) {
    const li = createListItem(shoppingItem);

    shoppingList.appendChild(li);
  });
}

function createListItem(shoppingItem) {
  const { id, name, completed } = shoppingItem;

  // checkbox
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = completed;
  input.addEventListener("change", toggleCompleted);

  // item name
  const div = document.createElement("div");
  div.textContent = name;
  div.classList.add("item-name");
  div.addEventListener("click", openEditMode);
  div.addEventListener("blur", closeEditMode);
  div.addEventListener("keydown", handleEnterKey);

  // delete button
  const button = document.createElement("button");
  button.innerHTML = '<i class="ri-delete-bin-7-line"></i>';
  button.classList.add("delete-button");
  button.addEventListener("click", removeItem);

  // drag icon
  const span = document.createElement("span");
  span.innerHTML = '<i class="ri-equal-line"></i>';
  span.classList.add("drag-icon");

  const li = document.createElement("li");
  li.draggable = true;
  li.setAttribute("data-id", id);
  li.toggleAttribute("data-completed", completed);

  li.appendChild(input);
  li.appendChild(div);
  li.appendChild(span);
  li.appendChild(button);

  return li;
}

function removeItem(e) {
  const listItem = e.target.closest("li");

  shoppingList.removeChild(listItem);

  updateNotice();
  saveItems();
}

function addItem(itemName) {
  const newListItem = createListItem({
    id: generateUniqueId(),
    name: itemName,
    completed: false,
  });

  shoppingList.prepend(newListItem);

  updateFilteredItems();
  updateNotice();
  saveItems();
}

function filterItems(filter) {
  const listItems = shoppingList.querySelectorAll("li");

  listItems.forEach(function (listItem) {
    const completed = listItem.hasAttribute("data-completed");

    if ("completed" === filter) {
      listItem.style.display = completed ? "flex" : "none";
    } else if ("incomplete" === filter) {
      listItem.style.display = completed ? "none" : "flex";
    } else {
      listItem.style.display = "flex";
    }
  });
}

function toggleCompleted(e) {
  const listItem = e.target.parentNode;

  listItem.toggleAttribute("data-completed", this.checked);

  updateFilteredItems();
  saveItems();
}

function openEditMode(e) {
  const itemName = e.target;
  const listItem = itemName.parentNode;

  // disable editing for completed items
  if (
    listItem.hasAttribute("data-completed") === false &&
    itemName.isContentEditable === false
  ) {
    itemName.contentEditable = true;
    listItem.draggable = false;

    // auto focus and move the cursor at the end of line
    let selection = window.getSelection();
    selection.selectAllChildren(itemName);
    selection.collapseToEnd();
  }
}

function closeEditMode(e) {
  const itemName = e.target;
  const listItem = itemName.parentNode;

  itemName.contentEditable = false;
  listItem.draggable = true;

  saveItems();
}

function handleEnterKey(e) {
  if (e.key === "Enter") {
    e.preventDefault(); // prevent line breaks
    closeEditMode(e);
  }
}

function handleDragDrop() {
  let dragItem = null;

  shoppingList.addEventListener("dragstart", function (e) {
    dragItem = e.target;
    setTimeout(() => e.target.classList.add("dragging"), 0);
    e.dataTransfer.setData("text/plain", "");
    e.dataTransfer.dropEffect = "move";
  });

  shoppingList.addEventListener("dragend", function (e) {
    dragItem = null;
    e.target.classList.remove("dragging");
    saveItems();
  });

  shoppingList.addEventListener("dragover", function (e) {
    e.preventDefault();
    const targetItem = e.target.closest("li");

    if (targetItem && targetItem !== dragItem) {
      const targetIndex = [...shoppingList.children].indexOf(targetItem);
      const dragIndex = [...shoppingList.children].indexOf(dragItem);

      const item =
        targetIndex > dragIndex ? targetItem.nextSibling : targetItem;

      shoppingList.insertBefore(dragItem, item);
    }
  });
}

function handleFormSubmit(e) {
  e.preventDefault();

  const itemName = document.getElementById("item").value;
  if (itemName.trim().length === 0) {
    alert("Vui lòng nhập tên món hàng hợp lệ!");
    return;
  }

  addItem(itemName);

  this.reset();
}

function handleFilterSelection(e) {
  const filter = e.target;

  filterButtons.forEach((btn) => btn.classList.remove("active"));

  filter.classList.add("active");

  filterItems(filter.getAttribute("data-filter"));
}

function handleClearItems(e) {
  const clearButton = e.target;

  if ("all" === clearButton.getAttribute("data-clear")) {
    shoppingList.innerHTML = "";
  } else {
    shoppingList
      .querySelectorAll("li[data-completed]")
      .forEach((listItem) => listItem.remove());
  }

  updateNotice();
  saveItems();
}

function updateFilteredItems() {
  const activeFilter = document.querySelector(".active[data-filter]");

  filterItems(activeFilter.getAttribute("data-filter"));
}

function updateNotice() {
  const isListEmpty = shoppingList.querySelectorAll("li").length === 0;

  const notice = document.querySelector(".shopping-notice");
  notice.classList.toggle("show", isListEmpty);
}

function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function initialize() {
  shoppingForm.addEventListener("submit", handleFormSubmit);

  filterButtons.forEach(function (button) {
    button.addEventListener("click", handleFilterSelection);
  });

  clearButtons.forEach(function (button) {
    button.addEventListener("click", handleClearItems);
  });
}

loadItems();
handleDragDrop();
updateNotice();
initialize();
