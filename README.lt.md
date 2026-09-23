# Ember Chat

**Pokalbių programėlė, kurioje kiekviena žinutė ateina kaip vašku užantspauduotas laiškas.**

[🇬🇧 English](README.md) · 🇱🇹 Lietuviškai

**[▶ Gyva demo versija](https://brutall100.github.io/ember-chat/)** · **[Kodas](https://github.com/brutall100/ember-chat)**

<img src="docs/screenshot.webp" alt="Ember Chat šviesiame režime: didelis užrašas „Ember Chat“, trys skaitikliai ir liniuotas rašomasis stalas su vaško antspaudų avatarais" width="1200" height="1754">

<p>
  <img src="docs/screenshot-dark.webp" alt="Ember Chat tamsiame režime" width="600" height="877" loading="lazy">
  <img src="docs/screenshot-mobile.webp" alt="Ember Chat 390 px telefono ekrane" width="150" height="881" loading="lazy">
</p>

---

## Apie projektą

Ember Chat buvo mano pirmas bandymas suprasti, kaip veikia pokalbių programėlė: forma,
Node.js serveris ir MySQL lentelė. Antroje versijoje ją paverčiau mažu, tikru produktu:

- Su **Node.js serveriu** laiškai visiems kambaryje esantiems pasiekia iškart
  (Socket.IO) ir yra saugomi **MySQL** duomenų bazėje.
- **GitHub Pages** svetainėje serverio nėra, todėl puslapis įjungia **demo režimą**:
  laiškai saugomi tavo naršyklėje (localStorage), o išgalvotas pašnekovas *Alex Doe*
  atrašo atgal.

Kurį režimą naudoti, puslapis nusprendžia pats. Nieko nustatinėti nereikia.

## Galimybės

- 💬 **Gyvas pokalbis** su Socket.IO. Atidaryk du skirtukus ir žiūrėk, kaip laiškai skraido tarp jų.
- 🗄️ **Žinučių istorija MySQL bazėje.** Įrašoma su `?` vietos žymekliais, todėl vartotojo tekstas negali pakeisti SQL užklausos.
- 🧪 **Demo režimas** GitHub Pages svetainei: naršyklės atmintis ir automatiškai atsakantis pašnekovas.
- 🔏 **Vaško antspaudo avatarai**, nupiešti SVG iš autoriaus inicialų. Jokių nuotraukų.
- 🕯️ **Gyvas fonas**: plaukiojantys žvakių švytėjimai ir kylančios žarijos. Animuojama tik `transform` ir `opacity`.
- 🌗 **Šviesus ir tamsus režimai**: seka sistemos nustatymą, įsimena tavo pasirinkimą ir nemirga kraunantis.
- 🔢 **Skaitikliai suskaičiuoja**: išsiųsti laiškai, prisijungę žmonės, parašyti žodžiai.
- ✉️ **Mikro-animacijos**: mygtukai pakyla ir nusileidžia, yra bangelė (ripple), išsiuntus nuskrenda vokelis, kortelės pakyla užvedus pelę, skyriai atsiranda slenkant.
- ♿ **Prieinamumas**: „Skip to content“ nuoroda, matomas `:focus-visible`, laukeliai su `<label>`, `aria-live` žinutės, patikrintas WCAG kontrastas, `prefers-reduced-motion` palaikymas.
- 📱 **Veikia telefone** (390 px), be slinkimo į šoną.

## Kuo sukurta

| Dalis | Technologija |
|---|---|
| Naršyklė | HTML, CSS (kintamieji), paprastas JavaScript |
| Serveris | Node.js, Express, Socket.IO |
| Duomenų bazė | MySQL / MariaDB (`mysql2`) |
| Nustatymai | `dotenv` (aplinkos kintamieji) |

### Spalvų paletė

| Kintamasis | HEX | Kam naudojama |
|---|---|---|
| `--ink` | `#0F0E0E` | Tamsus fonas, tekstas šviesiame režime, tekstas ant žalsvų mygtukų |
| `--wine` | `#541212` | Vaško antspaudai, tavo laiškai, antraštės šviesiame režime |
| `--teal` | `#468A9A` | Mygtukai, fokuso rėmelis, švytėjimas |
| `--mist` | `#EEEEEE` | Šviesus fonas, tekstas tamsiame režime |
| `--accent-text` | `#2F6573` / `#7FBCCA` | Žalsva spalva, patamsinta arba pašviesinta tekstui (šviesus / tamsus režimas) |

Visos spalvų poros patikrintos: tekstas turi bent **5.6 : 1**, mygtukai ir rėmeliai bent **3.38 : 1**.

### Šriftai (Google Fonts)

- **Merienda** – antraštės (primena ranka rašytą laišką)
- **Comic Neue** – tekstas ir žinutės
- **Overlock SC** – užrašai, mygtukai

## Ką išmokau

- Kaip **WebSocket** (Socket.IO) vienu metu nusiunčia duomenis visiems ir kuo tai skiriasi nuo paprasto `fetch` POST.
- Kodėl SQL užklausose reikia **vietos žymeklių**, o ne tekstų sujungimo.
- Kaip laikyti slaptus duomenis **aplinkos kintamuosiuose**, o ne git'e (`.env` + `.gitignore`).
- Kaip sukurti programėlę, kuri veikia **dviem režimais**: su tikru serveriu ir kaip statinė demo versija.
- Kaip visą temą sukurti iš **CSS kintamųjų**, kartu su tamsiu režimu, kuris nemirga.
- Kaip **kontrastą** tikrinti skaičiais, o ne akimis.

## Kaip paleisti savo kompiuteryje

Reikia **Node.js 18+**. MySQL nebūtinas.

```bash
git clone https://github.com/brutall100/ember-chat.git
cd ember-chat
npm install
cp .env.example .env      # tada .env faile įrašyk savo reikšmes
npm start                 # http://localhost:3000
```

**Su MySQL:** sukurk duomenų bazę ir vartotoją (žr. `sql/schema.sql`) ir `.env` faile
užpildyk `DB_*` reikšmes. Lentelę `messages` serveris sukurs pats.

**Be MySQL:** palik `DB_HOST` tuščią. Serveris žinutes laikys atmintyje, kol jo neišjungsi.

**Tik demo režimas:** atidaryk `index.html` per bet kokį statinį serverį (pvz.,
`npx serve .`). Be Node serverio puslapis įsijungia demo režimu.

| Režimas | Kaip paleisti | Kur saugomos žinutės |
|---|---|---|
| Gyvas + MySQL | `npm start` su užpildytais `DB_*` | MySQL lentelėje `messages` |
| Gyvas + atmintis | `npm start`, tuščias `DB_HOST` | Serverio atmintyje |
| Demo | GitHub Pages / bet koks statinis serveris | Tavo naršyklėje (localStorage) |

## Projekto struktūra

```
ember-chat/
├── index.html            # puslapio HTML
├── css/
│   └── styles.css        # visi stiliai; paletė :root viršuje
├── js/
│   ├── theme.js          # pritaiko išsaugotą temą dar prieš piešiant (be mirgėjimo)
│   ├── runtime-config.js # Pages svetainėje „demo“; serveris atsako „live“
│   └── app.js            # pokalbio logika, demo režimas, animacijos
├── images/
│   └── favicon.svg       # vaško antspaudo ikona paletės spalvomis
├── docs/                 # ekrano nuotraukos (WebP)
├── sql/
│   └── schema.sql        # MySQL lentelė
├── server.js             # Express + Socket.IO + MySQL
├── .env.example          # aplinkos kintamųjų pavyzdys
└── package.json
```

## Padėkos

- Gyvo pokalbio idėją įkvėpė oficiali [Socket.IO pamoka](https://socket.io/get-started/chat).
- Šriftai: [Merienda](https://fonts.google.com/specimen/Merienda), [Comic Neue](https://fonts.google.com/specimen/Comic+Neue), [Overlock SC](https://fonts.google.com/specimen/Overlock+SC) iš Google Fonts.
- „Alex Doe“ yra išgalvotas demo veikėjas.

## Licencija

[MIT](LICENSE) © 2023 brutall100
