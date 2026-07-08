// Complete Nepalese Administrative Divisions and Country List Data
export interface CountryOption {
  code: string;
  name: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: "NP", name: "Nepal" },
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "JP", name: "Japan" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "QA", name: "Qatar" },
  { code: "OUTSIDE", name: "Outside Nepal" },
  { code: "OTHER", name: "Other Country" },
];

export interface Province {
  id: string;
  name: string;
  districts: {
    [key: string]: string[]; // district name -> list of municipalities
  };
}

export const NEPAL_ADDRESS_DATA: Province[] = [
  {
    id: "P1",
    name: "Koshi Province",
    districts: {
      "Bhojpur": ["Bhojpur Municipality", "Shadanand Municipality", "Arun Rural Municipality", "Hatuwagadhi Rural Municipality", "Ramprasadrai Rural Municipality", "Other Bhojpur Municipality"],
      "Dhankuta": ["Dhankuta Municipality", "Pakhribas Municipality", "Mahalaxmi Municipality", "Chaubise Rural Municipality", "Other Dhankuta Municipality"],
      "Ilam": ["Ilam Municipality", "Deumai Municipality", "Mai Municipality", "Suryodaya Municipality", "Rong Rural Municipality", "Other Ilam Municipality"],
      "Jhapa": ["Mechinagar Municipality", "Bhadrapur Municipality", "Birtamod Municipality", "Damak Municipality", "Kankai Municipality", "Shivasatakshi Municipality", "Arjundhara Municipality", "Gauradaha Municipality", "Haldibari Rural Municipality", "Other Jhapa Municipality"],
      "Khotang": ["Diktel Rupakot Majhuwagadhi Municipality", "Halesi Tuwachung Municipality", "Ainselukharka Rural Municipality", "Other Khotang Municipality"],
      "Morang": ["Biratnagar Metropolitan City", "Belbari Municipality", "Pathari Sanischare Municipality", "Sundar Haraicha Municipality", "Rangeli Municipality", "Urlabari Municipality", "Letang Municipality", "Ratuwamai Municipality", "Sunawarshi Municipality", "Other Morang Municipality"],
      "Okhaldhunga": ["Siddhicharan Municipality", "Khijidemba Rural Municipality", "Champadevi Rural Municipality", "Other Okhaldhunga Municipality"],
      "Panchthar": ["Phidim Municipality", "Falelung Rural Municipality", "Kummayak Rural Municipality", "Other Panchthar Municipality"],
      "Sankhuwasabha": ["Khandbari Municipality", "Chainpur Municipality", "Madi Municipality", "Dharmadevi Municipality", "Panchkhapan Municipality", "Other Sankhuwasabha Municipality"],
      "Solukhumbu": ["Solu Dudhkunda Municipality", "Khumbu Pasanglhamu Rural Municipality", "Necha Salyan Rural Municipality", "Other Solukhumbu Municipality"],
      "Sunsari": ["Dharan Sub-Metropolitan City", "Itahari Sub-Metropolitan City", "Inaruwa Municipality", "Duhabi Municipality", "Ramdhuni Municipality", "Barahachhetra Municipality", "Bhokraha Rural Municipality", "Other Sunsari Municipality"],
      "Taplejung": ["Phungling Municipality", "Aathbrai Rural Municipality", "Pathibhara Yangwarak Rural Municipality", "Other Taplejung Municipality"],
      "Terhathum": ["Myanglung Municipality", "Laligurans Municipality", "Aathrai Rural Municipality", "Other Terhathum Municipality"],
      "Udayapur": ["Triyuga Municipality", "Chaudandigadhi Municipality", "Belaka Municipality", "Katari Municipality", "Udayapurgadhi Rural Municipality", "Other Udayapur Municipality"]
    }
  },
  {
    id: "P2",
    name: "Madhesh Province",
    districts: {
      "Bara": ["Kalaiya Sub-Metropolitan City", "Jeetpur Simara Sub-Metropolitan City", "Kolhabi Municipality", "Nijgadh Municipality", "Simroungadh Municipality", "Other Bara Municipality"],
      "Dhanusha": ["Janakpurdham Sub-Metropolitan City", "Chhireshwarnath Municipality", "Ganeshman Charnath Municipality", "Dhanusadham Municipality", "Mithila Municipality", "Sabaila Municipality", "Other Dhanusha Municipality"],
      "Mahottari": ["Jaleshwar Municipality", "Bardibas Municipality", "Gaushala Municipality", "Loharpatti Municipality", "Ramgopalpur Municipality", "Other Mahottari Municipality"],
      "Parsa": ["Birgunj Metropolitan City", "Bahudarmai Municipality", "Pokhariya Municipality", "Parsagadhi Municipality", "Other Parsa Municipality"],
      "Rautahat": ["Gaur Municipality", "Chandrapur Municipality", "Garuda Municipality", "Katahariya Municipality", "Other Rautahat Municipality"],
      "Saptari": ["Rajbiraj Municipality", "Kanakpatti Municipality", "Hanumannagar Kankalini Municipality", "Shambhunath Municipality", "Bode Barsain Municipality", "Other Saptari Municipality"],
      "Sarlahi": ["Malangwa Municipality", "Hariwan Municipality", "Lalbandi Municipality", "Ishworpur Municipality", "Barahathawa Municipality", "Other Sarlahi Municipality"],
      "Siraha": ["Siraha Municipality", "Lahan Municipality", "Golbazar Municipality", "Mirchaiya Municipality", "Sukhipur Municipality", "Other Siraha Municipality"]
    }
  },
  {
    id: "P3",
    name: "Bagmati Province",
    districts: {
      "Bhaktapur": ["Bhaktapur Municipality", "Madhyapur Thimi Municipality", "Changunarayan Municipality", "Suryabinayak Municipality", "Other Bhaktapur Municipality"],
      "Chitwan": ["Bharatpur Metropolitan City", "Ratnanagar Municipality", "Khairahani Municipality", "Rapti Municipality", "Kalika Municipality", "Madi Municipality", "Icchakamana Rural Municipality", "Other Chitwan Municipality"],
      "Dhading": ["Nilkantha Municipality", "Benighat Rorang Rural Municipality", "Galchhi Rural Municipality", "Gajuri Rural Municipality", "Other Dhading Municipality"],
      "Dolakha": ["Bhimeshwar Municipality", "Jiri Municipality", "Kalinchowk Rural Municipality", "Other Dolakha Municipality"],
      "Kathmandu": ["Kathmandu Metropolitan City", "Kirtipur Municipality", "Budhanilkantha Municipality", "Tokha Municipality", "Gokarneshwar Municipality", "Shankharapur Municipality", "Kageshwari Manohara Municipality", "Tarakeshwar Municipality", "Nagarjun Municipality", "Chandragiri Municipality", "Dakshinkali Municipality", "Other Kathmandu Municipality"],
      "Kavrepalanchok": ["Dhulikhel Municipality", "Banepa Municipality", "Panauti Municipality", "Namobuddha Municipality", "Panchkhal Municipality", "Mandandeupur Municipality", "Other Kavrepalanchok Municipality"],
      "Lalitpur": ["Lalitpur Metropolitan City", "Godawari Municipality", "Mahalaxmi Municipality", "Konjyosom Rural Municipality", "Other Lalitpur Municipality"],
      "Makwanpur": ["Hetauda Sub-Metropolitan City", "Thaha Municipality", "Bhimfedi Rural Municipality", "Manahari Rural Municipality", "Other Makwanpur Municipality"],
      "Nuwakot": ["Bidur Municipality", "Belkotgadhi Municipality", "Kakani Rural Municipality", "Other Nuwakot Municipality"],
      "Ramechhap": ["Manthali Municipality", "Ramechhap Municipality", "Khadadevi Rural Municipality", "Other Ramechhap Municipality"],
      "Rasuwa": ["Dhunche Municipality", "Gosainkunda Rural Municipality", "Kalika Rural Municipality", "Other Rasuwa Municipality"],
      "Sindhuli": ["Kamalamai Municipality", "Dudhauli Municipality", "Marin Rural Municipality", "Other Sindhuli Municipality"],
      "Sindhupalchok": ["Chautara Sangachowkgadhi Municipality", "Melamchi Municipality", "Barhabise Municipality", "Helambu Rural Municipality", "Other Sindhupalchok Municipality"]
    }
  },
  {
    id: "P4",
    name: "Gandaki Province",
    districts: {
      "Baglung": ["Baglung Municipality", "Dhorpatan Municipality", "Galkot Municipality", "Jaimini Municipality", "Other Baglung Municipality"],
      "Gorkha": ["Gorkha Municipality", "Palungtar Municipality", "Barpak Sulikot Rural Municipality", "Other Gorkha Municipality"],
      "Kaski": ["Pokhara Metropolitan City", "Annapurna Rural Municipality", "Rupa Rural Municipality", "Madi Rural Municipality", "Machhapuchhre Rural Municipality", "Other Kaski Municipality"],
      "Lamjung": ["Besisahar Municipality", "Sundarbazar Municipality", "Madhya Nepal Municipality", "Rainas Municipality", "Other Lamjung Municipality"],
      "Manang": ["Chhame Rural Municipality", "Manang Ngisyang Rural Municipality", "Nason Rural Municipality", "Other Manang Municipality"],
      "Mustang": ["Gharapjhong Rural Municipality", "Lomanthang Rural Municipality", "Varagung Muktikshetra Rural Municipality", "Other Mustang Municipality"],
      "Myagdi": ["Beni Municipality", "Annapurna Rural Municipality", "Mangala Rural Municipality", "Other Myagdi Municipality"],
      "Nawalpur": ["Kawasoti Municipality", "Gaidakot Municipality", "Devchuli Municipality", "Madhyabindu Municipality", "Other Nawalpur Municipality"],
      "Parbat": ["Kushma Municipality", "Phalebas Municipality", "Jaljala Rural Municipality", "Other Parbat Municipality"],
      "Syangja": ["Putalibazar Municipality", "Waling Municipality", "Galyang Municipality", "Chapakot Municipality", "Bhirkot Municipality", "Other Syangja Municipality"],
      "Tanahu": ["Byas Municipality", "Damauli Municipality", "Shuklagandaki Municipality", "Bhimad Municipality", "Bhanu Municipality", "Devghat Rural Municipality", "Other Tanahu Municipality"]
    }
  },
  {
    id: "P5",
    name: "Lumbini Province",
    districts: {
      "Arghakhanchi": ["Sandhikharka Municipality", "Sitganga Municipality", "Bhumikasthan Municipality", "Other Arghakhanchi Municipality"],
      "Banke": ["Nepalgunj Sub-Metropolitan City", "Kohalpur Municipality", "Khajura Rural Municipality", "Baijanath Rural Municipality", "Other Banke Municipality"],
      "Bardiya": ["Gulariya Municipality", "Rajapur Municipality", "Madhuwan Municipality", "Bansgadhi Municipality", "Thakurbaba Municipality", "Barbadiya Municipality", "Other Bardiya Municipality"],
      "Dang": ["Ghorahi Sub-Metropolitan City", "Tulsipur Sub-Metropolitan City", "Lamahi Municipality", "Rapti Rural Municipality", "Other Dang Municipality"],
      "Gulmi": ["Resunga Municipality", "Musikot Municipality", "Ruru Rural Municipality", "Other Gulmi Municipality"],
      "Kapilvastu": ["Taulihawa Municipality", "Kapilvastu Municipality", "Banganga Municipality", "Buddhabhumi Municipality", "Shivaraj Municipality", "Krishnanagar Municipality", "Other Kapilvastu Municipality"],
      "Parasi": ["Ramgram Municipality", "Sunwal Municipality", "Bardaghat Municipality", "Sarawal Rural Municipality", "Other Parasi Municipality"],
      "Palpa": ["Tansen Municipality", "Rampur Municipality", "Ribdikot Rural Municipality", "Other Palpa Municipality"],
      "Pyuthan": ["Pyuthan Municipality", "Swargadwari Municipality", "Mallarani Rural Municipality", "Other Pyuthan Municipality"],
      "Rolpa": ["Liwang Municipality", "Rolpa Municipality", "Sunilsmriti Rural Municipality", "Other Rolpa Municipality"],
      "Rukum Purba": ["Sisne Rural Municipality", "Bhume Rural Municipality", "Putha Uttarganga Rural Municipality", "Other Rukum Purba Municipality"],
      "Rupandehi": ["Butwal Sub-Metropolitan City", "Siddharthanagar Municipality", "Devdaha Municipality", "Lumbini Sanskritik Municipality", "Tilottama Municipality", "Sainamaina Municipality", "Other Rupandehi Municipality"]
    }
  },
  {
    id: "P6",
    name: "Karnali Province",
    districts: {
      "Dailekh": ["Narayan Municipality", "Dullu Municipality", "Aathbis Municipality", "Chamunda Bindrasaini Municipality", "Other Dailekh Municipality"],
      "Dolpa": ["Dunai Municipality", "Tripurasundari Municipality", "Shey Phoksundo Rural Municipality", "Other Dolpa Municipality"],
      "Humla": ["Simikot Rural Municipality", "Namkha Rural Municipality", "Sarkegad Rural Municipality", "Other Humla Municipality"],
      "Jajarkot": ["Bheri Municipality", "Chhedagad Municipality", "Nalgad Municipality", "Barekot Rural Municipality", "Other Jajarkot Municipality"],
      "Jumla": ["Chandannath Municipality", "Tatopani Rural Municipality", "Sinja Rural Municipality", "Other Jumla Municipality"],
      "Kalikot": ["Manma Municipality", "Khandachakra Municipality", "Raskot Municipality", "Tila Gupha Municipality", "Other Kalikot Municipality"],
      "Mugu": ["Gamgadhi Municipality", "Chhayanath Rara Municipality", "Sorigad Rural Municipality", "Other Mugu Municipality"],
      "Salyan": ["Shaarda Municipality", "Bagchaur Municipality", "Banfikot Rural Municipality", "Other Salyan Municipality"],
      "Surkhet": ["Birendranagar Municipality", "Gurbhakot Municipality", "Panchapuri Municipality", "Bheri Ganga Municipality", "Lekhbeshi Municipality", "Other Surkhet Municipality"],
      "Rukum Paschim": ["Musikot Municipality", "Chaurjahari Municipality", "Aathbiskot Municipality", "Other Rukum Paschim Municipality"]
    }
  },
  {
    id: "P7",
    name: "Sudurpashchim Province",
    districts: {
      "Achham": ["Mangalsen Municipality", "Kamalbazar Municipality", "Sanphebagar Municipality", "Other Achham Municipality"],
      "Baitadi": ["Dasharathchand Municipality", "Patan Municipality", "Melauli Municipality", "Puchaudi Municipality", "Other Baitadi Municipality"],
      "Bajhang": ["Jayaprithvi Municipality", "Bungal Municipality", "Talkot Rural Municipality", "Other Bajhang Municipality"],
      "Bajura": ["Martadi Municipality", "Badimalika Municipality", "Triveni Municipality", "Budhiganga Municipality", "Other Bajura Municipality"],
      "Dadeldhura": ["Amargadhi Municipality", "Parshuram Municipality", "Navadurga Rural Municipality", "Other Dadeldhura Municipality"],
      "Darchula": ["Khalanga Municipality", "Mahakali Municipality", "Shailyashikhar Municipality", "Other Darchula Municipality"],
      "Doti": ["Silmari Municipality", "Dipayal Silgadhi Municipality", "K I Singh Rural Municipality", "Other Doti Municipality"],
      "Kailali": ["Dhangadhi Sub-Metropolitan City", "Tikapur Municipality", "Ghoda Ghodi Municipality", "Lamki Chuha Municipality", "Bhajani Municipality", "Godawari Municipality", "Gauriganga Municipality", "Other Kailali Municipality"],
      "Kanchanpur": ["Mahendranagar Municipality", "Bhimdatta Municipality", "Bedkot Municipality", "Belauri Municipality", "Punasanor Municipality", "Dodhara Chandani Municipality", "Krishnapur Municipality", "Other Kanchanpur Municipality"]
    }
  }
];
