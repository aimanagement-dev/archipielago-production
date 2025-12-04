# ✅ Verificación Final - Deploy Online

## 📋 Estado Actual

Tienes todas las variables de entorno configuradas en Vercel:
- ✅ GOOGLE_CLIENT_ID
- ✅ GOOGLE_CLIENT_SECRET
- ✅ NEXTAUTH_SECRET
- ✅ NEXTAUTH_URL
- ✅ GOOGLE_SERVICE_ACCOUNT_EMAIL
- ✅ GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
- ✅ GOOGLE_CALENDAR_ID
- ✅ GOOGLE_CALENDAR_TIMEZONE

## 🔍 Verificaciones Necesarias

### 1. Verificar GOOGLE_CLIENT_ID

**CRÍTICO:** Asegúrate de que el `GOOGLE_CLIENT_ID` en Vercel sea:
```
316019146556-qcdd1ea8o6u8uboj756rad0r4turjech.apps.googleusercontent.com
```

**NOTA:** Debe ser `316019146556` (sin el 5 extra), que es el que corregimos en local.

Si en Vercel está el antiguo (`3160191465556`), debes actualizarlo:
1. Click en los 3 puntos del GOOGLE_CLIENT_ID
2. Click en "Edit"
3. Cambia el valor al correcto
4. Guarda

### 2. Verificar NEXTAUTH_URL

Asegúrate de que `NEXTAUTH_URL` apunte a tu URL de producción:
```
https://archipielago-production.vercel.app
```
(O la URL que te haya dado Vercel)

### 3. Actualizar Redirect URI en Google Cloud Console

**IMPORTANTE:** Debes agregar la URL de producción a Google Cloud Console:

1. Ve a: https://console.cloud.google.com/
2. **APIs & Services** > **Credentials**
3. Edita tu OAuth Client ID (`316019146556-qcdd1ea8o6u8uboj756rad0r4turjech...`)
4. En **"Authorized redirect URIs"**, asegúrate de tener AMBAS:
   ```
   http://localhost:3000/api/auth/callback/google
   https://archipielago-production.vercel.app/api/auth/callback/google
   ```
   (Reemplaza con tu URL real de Vercel si es diferente)
5. **GUARDA** los cambios

## 🚀 Siguiente Paso: Redeploy

Una vez verificadas las configuraciones:

```bash
vercel --prod
```

O desde Vercel Dashboard:
1. Ve a **Deployments**
2. Click en los **3 puntos** del último deployment
3. Click en **Redeploy**

## ✅ Checklist Final

- [ ] GOOGLE_CLIENT_ID es el correcto (316019146556...)
- [ ] NEXTAUTH_URL apunta a la URL de producción
- [ ] Redirect URI de producción agregada en Google Cloud Console
- [ ] Redeploy realizado
- [ ] App accesible y funcionando online

---

**¿Todo verificado?** Si las configuraciones están correctas, procede con el redeploy.


