import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import EIcons from '@embrace-ui/icons-vue/global'
const app = createApp(App)
app.use(EIcons, {})
app.mount('#app')
