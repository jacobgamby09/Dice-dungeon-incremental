import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import '../newGame.css'
import '../styles/arcade/index.css'
import './talent-editor.css'
import { TalentTreeEditor } from './TalentTreeEditor'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TalentTreeEditor />
  </StrictMode>,
)
