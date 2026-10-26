$(document).ready(function () {
  console.log('Welcome to Revenual.com');

  // Manage delete report
  const deleteButton = document.querySelector<HTMLInputElement>('.report__delete');

  const deleteReportAlert = () => {
    const result = confirm("Do you really want to delete this report ?");
    if (result) {
      const path = deleteButton.dataset.delete;
      window.location.href = path;
    }
  }

  if (deleteButton) {
    deleteButton.addEventListener('click', deleteReportAlert);
  }

  // Manage delete account
  const deleteButtons = document.querySelectorAll('.account__delete');

  const deleteAccountAlert = (event: any) => {
    const result = confirm("Do you really want to delete this account ?");

    if (result) {
      const item = event.target || event.srcElement;
      const path = item.dataset.delete;
      window.location.href = path;
    }
  }

  for (const deleteAccountButton of deleteButtons) {
    deleteAccountButton.addEventListener('click', deleteAccountAlert);
  }

  // Manage cancel subscription account
  const cancelButton = document.querySelector('.button--cancel-subscription');

  const cancelSubscriptionAlert = (event: any) => {
    const result = confirm("Do you really want to cancel your subscription ?");

    if (result) {
      const item = event.target || event.srcElement;
      const path = item.dataset.delete;
      window.location.href = path;
    }
  }

  if (cancelButton) {
    cancelButton.addEventListener('click', cancelSubscriptionAlert);
  }


  // Function to create the loader function
  const createLoaderFunction = (content: string = '') => {
    return () => {
      const loader = document.createElement('div');
      const animation = document.createElement('div')
      const text = document.createElement('p');

      animation.innerHTML = `<svg viewBox="25 25 50 50">
        <circle cx="50" cy="50" r="20"></circle>
      </svg>`;

      text.innerText = content

      loader.appendChild(animation);
      loader.appendChild(text);

      loader.classList.add('loader');
      document.body.appendChild(loader);
    }
  }

  // List of loader functions
  const loaderReport = createLoaderFunction('Please wait, creating a report can take up to a few minutes, in the future reports will be generated automatically');
  const loaderSimple = createLoaderFunction();

  // Putting event for loaders
  const createButtons: any = document.querySelectorAll('.button--create');
  for (const createButton of createButtons) {
    createButton.addEventListener('click', loaderReport);
  }
  const loginForm: any = document.querySelector('.login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', loaderSimple);
  }
});