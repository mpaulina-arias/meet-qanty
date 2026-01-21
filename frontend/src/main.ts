import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './services/firebase' // Configuración de firebase

import { useAuthStore } from '@/stores/auth.store' //Autenticación

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

//Autenticación: Iniciar el listener de Firebase Auth
const authStore = useAuthStore()
authStore.initAuthListener()
