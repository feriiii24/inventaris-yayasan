import axios from 'axios';

window.axios = axios;

const csrfToken = document.head.querySelector('meta[name="csrf-token"]');

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

if (csrfToken) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken.getAttribute('content');
}

const xsrfToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('XSRF-TOKEN='));

if (xsrfToken) {
    window.axios.defaults.headers.common['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken.split('=')[1]);
}
