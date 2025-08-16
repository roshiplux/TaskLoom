# 📱 TaskLoom Mobile Testing with Live Server

## 🚀 **Method 1: VS Code Live Server Extension (Recommended)**

### **Step 1: Install Live Server Extension**
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Live Server" by Ritwick Dey
4. Install the extension

### **Step 2: Start Live Server**
1. Right-click on `index.html` in VS Code
2. Select **"Open with Live Server"**
3. Your browser will open with: `http://127.0.0.1:5500/`

### **Step 3: Find Your Computer's IP Address**

#### **Windows (PowerShell):**
```powershell
ipconfig | findstr "IPv4"
```

#### **Alternative Windows Command:**
```cmd
ipconfig /all
```
Look for "IPv4 Address" under your active network adapter.

### **Step 4: Access on Mobile**
1. **Ensure same WiFi**: Both computer and mobile on same network
2. **Mobile URL format**: `http://YOUR_IP:5500/`
3. **Example**: If your IP is `192.168.1.100`, use:
   ```
   http://192.168.1.100:5500/
   ```

## 🚀 **Method 2: Python Simple HTTP Server**

### **Step 1: Open Terminal in TaskLoom Directory**
```powershell
cd D:\TaskLoom
```

### **Step 2: Start Python Server**
```powershell
# Python 3
python -m http.server 8000

# Or Python 2 (if needed)
python -m SimpleHTTPServer 8000
```

### **Step 3: Access on Mobile**
- **Local**: `http://localhost:8000/`
- **Mobile**: `http://YOUR_IP:8000/`

## 🚀 **Method 3: Node.js http-server**

### **Step 1: Install http-server globally**
```powershell
npm install -g http-server
```

### **Step 2: Start Server**
```powershell
cd D:\TaskLoom
http-server -p 8080 -o
```

### **Step 3: Access on Mobile**
- **Mobile**: `http://YOUR_IP:8080/`

## 🔧 **Step-by-Step Mobile Setup**

### **1. Get Your Computer's IP Address**
Run this in PowerShell:
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"} | Select-Object IPAddress
```

### **2. Configure Live Server Settings (Optional)**
Create `.vscode/settings.json` in your TaskLoom folder:
```json
{
    "liveServer.settings.port": 5500,
    "liveServer.settings.host": "0.0.0.0",
    "liveServer.settings.donotShowInfoMsg": true,
    "liveServer.settings.CustomBrowser": "chrome"
}
```

### **3. Test Mobile Access**
1. **Start Live Server** in VS Code
2. **Find your IP** using PowerShell command above
3. **Open mobile browser** and navigate to `http://YOUR_IP:5500/`

## 📱 **Mobile Testing Checklist**

### **✅ Before Testing:**
- [ ] Computer and mobile on same WiFi network
- [ ] Live Server running on computer
- [ ] IP address identified
- [ ] Firewall/antivirus not blocking port 5500

### **🔍 Test These Features:**
- [ ] **Touch Navigation**: Tap buttons and links
- [ ] **Mobile Menu**: Hamburger menu functionality
- [ ] **Sign-In**: Google OAuth on mobile
- [ ] **Calendar Gestures**: Swipe navigation
- [ ] **Task Management**: Add/edit tasks on mobile
- [ ] **Responsive Layout**: Check different orientations
- [ ] **Performance**: Loading speed on mobile

## 🛠️ **Troubleshooting**

### **Can't Access from Mobile?**

#### **Check Network Connection:**
```powershell
# Ping your mobile from computer
ping YOUR_MOBILE_IP

# Check if port 5500 is listening
netstat -an | findstr :5500
```

#### **Firewall Issues:**
1. **Windows Defender**: Allow Live Server through firewall
2. **Temporarily disable** Windows Firewall for testing
3. **Router settings**: Check if port blocking is enabled

#### **Alternative IP Discovery:**
```powershell
# More detailed network info
ipconfig /all | findstr /i "ipv4"

# Or use this comprehensive command
(Get-WmiObject -Class Win32_NetworkAdapterConfiguration | Where-Object {$_.DefaultIPGateway -ne $null}).IPAddress | Where-Object {$_ -like "192.168.*"}
```

### **Live Server Not Starting?**
1. **Restart VS Code**
2. **Check if port 5500 is in use**:
   ```powershell
   netstat -ano | findstr :5500
   ```
3. **Try different port** in Live Server settings

## 🎯 **Quick Start Command**

Run this PowerShell script to get your IP and instructions:

```powershell
# Get IP address
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}).IPAddress
Write-Host "Your IP Address: $ip" -ForegroundColor Green
Write-Host "Mobile URL: http://$ip:5500/" -ForegroundColor Yellow
Write-Host "1. Start Live Server in VS Code" -ForegroundColor Cyan
Write-Host "2. Open the mobile URL above on your phone" -ForegroundColor Cyan
```

## 📋 **Expected Mobile Experience**

When you access TaskLoom on mobile, you should see:
- ✅ **Responsive design** adapting to mobile screen
- ✅ **Touch-friendly buttons** with proper sizing
- ✅ **Mobile navigation** with hamburger menu
- ✅ **Google Sign-In** working on mobile browser
- ✅ **Calendar swipe gestures** for navigation
- ✅ **Mobile-optimized** task management interface

**Your TaskLoom app is fully mobile-ready! 📱✨**
