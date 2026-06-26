## **Change Healthcare Attack (February 2024)**  

### What Happened  
Change Healthcare, a key provider for the U.S. healthcare industry and one of the largest healthcare payment processing companies in the country, was hit by a massive **ransomware** attack (attacco informatico in cui i dati vengono rubati e crittografati finché non viene pagato un riscatto) starting on February 21, 2024. The incident has been classified as the most significant and damaging cyberattack ever launched against the U.S. healthcare system.  

The group identified as responsible is **BlackCat**, also known as **ALPHV/BlackCat (AlphaV)**, notorious for conducting large-scale breaches (**violazioni su vasta scala**) in recent years.  

<img width="259" height="194" alt="image" src="https://github.com/user-attachments/assets/da5bf853-e16e-4e4c-866e-8f5e8ed19b50" />

The attack resulted in the **encryption** (crittografia) of Change Healthcare’s files and the massive **exfiltration** (furto e trasferimento illecito all’esterno) of highly sensitive data. The impact was extraordinary: the latest estimate indicates that about **192.7 million individuals** were affected, making it the largest healthcare data breach ever reported.  

---

### How It Happened  
The attack occurred in two main phases: **initial access** and **lateral movement**.  

**Initial Access and Credential Theft:**  
The attack began on February 12, 2024, when hackers gained entry by stealing a password and compromised credentials (**credenziali compromesse**). They used these credentials to access an application — specifically, a **Citrix remote access portal** (portale Citrix per accesso remoto) — that was externally exposed.  

<img width="2555" height="1299" alt="image" src="https://github.com/user-attachments/assets/dd81a35c-c357-4b5e-b482-4e3802dc9675" />

**Lateral Movement and Exfiltration:**  
Once inside, the attackers maintained a **dwell time** (tempo di permanenza nella rete compromessa) of nine days (February 12–20, 2024). During this period, they moved **laterally** (cioè si spostarono tra diversi sistemi all’interno della rete), created privileged **administrator accounts** (account amministrativi), and **exfiltrated** around **6 terabytes (TB)** of sensitive data.  

**Ransomware Deployment:**  
The actual ransomware detonation (**detonazione del ransomware**, cioè l’attivazione del malware) and system encryption occurred on February 21, 2024. The attack was only detected when files were already encrypted and access was blocked.  

<img width="2400" height="1299" alt="image" src="https://github.com/user-attachments/assets/846f560b-37e8-4cc4-af13-2598e0a5ce4d" />


---

### The Causes  
The main and most criticized cause of the attack was **negligence in basic cybersecurity practices**.  

- **Lack of Multi-Factor Authentication (MFA):**  
  The critical Citrix remote access system that was compromised did not have MFA enabled. MFA is considered a fundamental security measure, and its absence left the system vulnerable to stolen credentials.  

<img width="800" height="418" alt="image" src="https://github.com/user-attachments/assets/f0dd0380-0651-4613-982a-a330e1169ab9" />


- **Weak/Compromised Credentials:**  
  Access was obtained using the username and password of a low-level customer support employee, believed to have been leaked in a Telegram group known for selling stolen credentials.  

- **Inadequate Security Systems:**  
  The fact that attackers remained undetected for nine days (a long **dwell time**) indicates potential weaknesses in Change Healthcare’s threat detection and response capabilities (**capacità di rilevamento e risposta alle minacce**).  

- **Lack of Updates:**  
  Although UnitedHealth Group (UHG) had acquired Change Healthcare in 2022, full implementation of MFA and other security updates—particularly on legacy systems (**sistemi obsoleti o datati**)—had not been completed at the time of the attack.  

---

### The Consequences  
The consequences were widespread and triggered a **ripple effect** (effetto domino) across the entire U.S. healthcare ecosystem.  

- **Financial and Operational Impact on Providers:**  
  The prolonged system outages disrupted the **revenue cycle** (flusso di incassi), preventing healthcare providers from submitting insurance claims, verifying eligibility, and receiving payments. Many providers, especially small clinics, had to use personal funds, faced months-long payment delays, and some temporarily laid off staff.  

- **Cost to UnitedHealth Group (UHG):**  
  UHG estimated that the total impact of the 2024 attack would reach around **$2.87 billion**. The company provided approximately **$9 billion in interest-free loans** to assist providers facing liquidity issues (**problemi di liquidità**).  

- **Sensitive Data Risk:**  
  The stolen data, involving nearly 193 million people, included health information, Social Security numbers, driver’s licenses, and financial data — exposing individuals to fraud and identity theft (**furto d’identità**).  

- **Double Extortion:**  
  UHG paid a **$22 million ransom (in Bitcoin)** to the BlackCat group in an attempt to protect patient data. However, BlackCat carried out an **exit scam** (truffa di uscita — quando un gruppo criminale scompare con il denaro senza rispettare gli accordi), refusing to pay its affiliate who executed the attack. The affiliate later attempted a second extortion with another ransomware group, **RansomHub**, threatening to leak the data.  

<img width="396" height="127" alt="image" src="https://github.com/user-attachments/assets/78aa7840-70a7-4ef6-9def-d29ccb846bd4" />

### Sources
> Videos

[![immagine](https://img.youtube.com/vi/ZMK-egM-gHU/0.jpg)](https://www.youtube.com/watch?v=ZMK-egM-gHU)
[![immagine](https://img.youtube.com/vi/ryauOZIg2KY/0.jpg)](https://www.youtube.com/watch?v=ryauOZIg2KY)

> Sites

[![immagine](https://github.com/user-attachments/assets/921bb9cc-0cc1-42eb-b07b-cc5640b298eb)](https://www.hipaajournal.com/change-healthcare-responding-to-cyberattack/)
[![immagine](https://github.com/user-attachments/assets/921bb9cc-0cc1-42eb-b07b-cc5640b298eb)](https://www.blackfog.com/change-healthcare-landmark-cybersecurity-breach/)


