interface BibleVerse {
  id: string;
  verse: string;
  reference: string;
  category: string;
}

// Bible verses organized into 12 levels with non-sequential progression
// Each level has completely different verses, well-known first, mixed themes
// Organized by difficulty: shorter verses first, longer ones later

export const bibleVersesByLevel: Record<number, BibleVerse[]> = {
  // Level 1: Well-known short verses (4 verses - easiest)
  1: [
    { id: 'john-3-16', verse: 'For God so loved the world that he gave his one and only Son', reference: 'John 3:16', category: 'salvation' },
    { id: 'psalm-23-1', verse: 'The Lord is my shepherd, I lack nothing', reference: 'Psalm 23:1', category: 'comfort' },
    { id: 'phil-4-13', verse: 'I can do all things through Christ who strengthens me', reference: 'Philippians 4:13', category: 'strength' },
    { id: 'josh-1-9', verse: 'Be strong and courageous. Do not be afraid', reference: 'Joshua 1:9', category: 'courage' }
  ],

  // Level 5: Medium well-known verses (6 verses - medium difficulty)
  5: [
    { id: 'rom-8-28', verse: 'And we know that in all things God works for the good of those who love him', reference: 'Romans 8:28', category: 'hope' },
    { id: 'prov-3-5-6', verse: 'Trust in the Lord with all your heart and lean not on your own understanding', reference: 'Proverbs 3:5-6', category: 'wisdom' },
    { id: 'isa-40-31', verse: 'But those who wait on the Lord shall renew their strength', reference: 'Isaiah 40:31', category: 'strength' },
    { id: 'jer-29-11', verse: 'For I know the plans I have for you, declares the Lord', reference: 'Jeremiah 29:11', category: 'hope' },
    { id: 'matt-6-33', verse: 'But seek first the kingdom of God and His righteousness', reference: 'Matthew 6:33', category: 'priority' },
    { id: 'psalm-56-3', verse: 'Whenever I am afraid, I will trust in You', reference: 'Psalm 56:3', category: 'trust' }
  ],

  // Level 2: Mix of short verses (4 verses)
  2: [
    { id: 'gen-1-1', verse: 'In the beginning God created the heavens and the earth', reference: 'Genesis 1:1', category: 'creation' },
    { id: 'lev-19-11', verse: 'You shall not steal, nor deal falsely, nor lie to one another', reference: 'Leviticus 19:11', category: 'integrity' },
    { id: 'matt-5-16', verse: 'Let your light so shine before men', reference: 'Matthew 5:16', category: 'witness' },
    { id: '1-pet-5-7', verse: 'Cast all your anxiety on him because he cares for you', reference: '1 Peter 5:7', category: 'comfort' }
  ],

  // Level 8: Longer well-known verses (8 verses - harder)
  8: [
    { id: 'psalm-23-full', verse: 'The Lord is my shepherd, I lack nothing. He makes me to lie down in green pastures', reference: 'Psalm 23:1-2', category: 'comfort' },
    { id: 'eph-2-8-9', verse: 'For by grace you have been saved through faith—and this is not from yourselves', reference: 'Ephesians 2:8-9', category: 'salvation' },
    { id: 'rom-5-8', verse: 'But God demonstrates his own love for us in this: While we were still sinners, Christ died for us', reference: 'Romans 5:8', category: 'love' },
    { id: 'isa-41-10', verse: 'Fear not, for I am with you; Be not dismayed, for I am your God', reference: 'Isaiah 41:10', category: 'comfort' },
    { id: '1-cor-13-4-5', verse: 'Love is patient, love is kind. It does not envy, it does not boast', reference: '1 Corinthians 13:4-5', category: 'love' },
    { id: 'phil-4-4-7', verse: 'Rejoice in the Lord always. I will say it again: Rejoice!', reference: 'Philippians 4:4', category: 'joy' },
    { id: '2-cor-5-17', verse: 'Therefore, if anyone is in Christ, he is a new creation', reference: '2 Corinthians 5:17', category: 'renewal' },
    { id: 'gal-2-20', verse: 'I have been crucified with Christ and I no longer live, but Christ lives in me', reference: 'Galatians 2:20', category: 'identity' }
  ],

  // Level 3: Medium length verses (6 verses)
  3: [
    { id: 'psalm-119-11', verse: 'Your word I have hidden in my heart, That I might not sin against You', reference: 'Psalm 119:11', category: 'word' },
    { id: 'rom-10-17', verse: 'So then faith comes by hearing, and hearing by the word of God', reference: 'Romans 10:17', category: 'faith' },
    { id: 'prov-9-10', verse: 'The fear of the Lord is the beginning of wisdom', reference: 'Proverbs 9:10', category: 'wisdom' },
    { id: 'heb-11-1', verse: 'Now faith is confidence in what we hope for and assurance about what we do not see', reference: 'Hebrews 11:1', category: 'faith' },
    { id: '1-john-1-9', verse: 'If we confess our sins, He is faithful and just to forgive us our sins', reference: '1 John 1:9', category: 'forgiveness' },
    { id: 'matt-4-19', verse: 'Follow Me, and I will make you fishers of men', reference: 'Matthew 4:19', category: 'calling' }
  ],

  // Level 9: Long verses (8 verses - challenging)
  9: [
    { id: 'psalm-100', verse: 'Make a joyful shout to the Lord, all you lands! Serve the Lord with gladness', reference: 'Psalm 100:1-2', category: 'worship' },
    { id: 'matt-6-9-13', verse: 'Our Father in heaven, Hallowed be Your name. Your kingdom come', reference: 'Matthew 6:9-13', category: 'prayer' },
    { id: 'rom-8-38-39', verse: 'For I am persuaded that neither death nor life, nor angels nor principalities', reference: 'Romans 8:38-39', category: 'security' },
    { id: 'eph-4-29', verse: 'Let no corrupt word proceed out of your mouth, but what is good for necessary edification', reference: 'Ephesians 4:29', category: 'speech' },
    { id: 'col-3-16-17', verse: 'Let the word of Christ dwell in you richly in all wisdom, teaching and admonishing', reference: 'Colossians 3:16-17', category: 'worship' },
    { id: '1-thess-5-16-18', verse: 'Rejoice always, pray without ceasing, in everything give thanks', reference: '1 Thessalonians 5:16-18', category: 'lifestyle' },
    { id: '2-tim-3-16-17', verse: 'All Scripture is given by inspiration of God, and is profitable for doctrine', reference: '2 Timothy 3:16-17', category: 'scripture' },
    { id: 'heb-4-12', verse: 'For the word of God is living and powerful, and sharper than any two-edged sword', reference: 'Hebrews 4:12', category: 'word' }
  ],

  // Level 4: Short to medium mixed (6 verses)
  4: [
    { id: 'psalm-147-5', verse: 'Great is our Lord, and mighty in power; His understanding is infinite', reference: 'Psalm 147:5', category: 'power' },
    { id: 'isa-26-3', verse: 'You will keep him in perfect peace, Whose mind is stayed on You', reference: 'Isaiah 26:3', category: 'peace' },
    { id: 'lam-3-22-23', verse: 'Through the Lord\'s mercies we are not consumed, Because His compassions fail not', reference: 'Lamentations 3:22-23', category: 'mercy' },
    { id: 'mark-10-45', verse: 'For even the Son of Man did not come to be served, but to serve', reference: 'Mark 10:45', category: 'service' },
    { id: 'rom-6-23', verse: 'For the wages of sin is death, but the gift of God is eternal life', reference: 'Romans 6:23', category: 'salvation' },
    { id: '1-cor-6-20', verse: 'For you were bought at a price; therefore glorify God in your body', reference: '1 Corinthians 6:20', category: 'stewardship' }
  ],

  // Level 10: Very long verses (8 verses - expert level)
  10: [
    { id: 'psalm-23-complete', verse: 'The Lord is my shepherd, I lack nothing. He makes me to lie down in green pastures; He leads me beside the still waters. He restores my soul; He leads me in the paths of righteousness For His name\'s sake. Yea, though I walk through the valley of the shadow of death, I will fear no evil; For You are with me; Your rod and Your staff, they comfort me. You prepare a table before me in the presence of my enemies; You anoint my head with oil; My cup runs over. Surely goodness and mercy shall follow me All the days of my life; And I will dwell in the house of the Lord Forever.', reference: 'Psalm 23', category: 'comfort' },
    { id: 'rom-12-1-2', verse: 'I beseech you therefore, brethren, by the mercies of God, that you present your bodies a living sacrifice, holy, acceptable to God, which is your reasonable service. And do not be conformed to this world, but be transformed by the renewing of your mind, that you may prove what is that good and acceptable and perfect will of God.', reference: 'Romans 12:1-2', category: 'transformation' },
    { id: 'phil-4-4-8', verse: 'Rejoice in the Lord always. Again I will say, rejoice! Let your gentleness be known to all men. The Lord is at hand. Be anxious for nothing, but in everything by prayer and supplication, with thanksgiving, let your requests be made known to God; and the peace of God, which surpasses all understanding, will guard your hearts and minds through Christ Jesus. Finally, brethren, whatever things are true, whatever things are noble, whatever things are just, whatever things are pure, whatever things are lovely, whatever things are of good report, if there is any virtue and if there is anything praiseworthy--meditate on these things.', reference: 'Philippians 4:4-8', category: 'mindset' },
    { id: 'col-3-12-17', verse: 'Therefore, as the elect of God, holy and beloved, put on tender mercies, kindness, humility, meekness, longsuffering; bearing with one another, and forgiving one another, if anyone has a complaint against another; even as Christ forgave you, so you also must do. But above all these things put on love, which is the bond of perfection. And let the peace of God rule in your hearts, to which also you were called in one body; and be thankful. Let the word of Christ dwell in you richly in all wisdom, teaching and admonishing one another in psalms and hymns and spiritual songs, singing with grace in your hearts to the Lord. And whatever you do in word or deed, do all in the name of the Lord Jesus, giving thanks to God the Father through Him.', reference: 'Colossians 3:12-17', category: 'character' },
    { id: '2-tim-3-12-17', verse: 'Yes, and all who desire to live godly in Christ Jesus will suffer persecution. But you must continue in the things which you have learned and been assured of, knowing from whom you have learned them, and that from childhood you have known the Holy Scriptures, which are able to make you wise for salvation through faith which is in Christ Jesus. All Scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness, that the man of God may be complete, thoroughly equipped for every good work.', reference: '2 Timothy 3:12-17', category: 'perseverance' },
    { id: '1-pet-4-8-11', verse: 'And above all things have fervent love for one another, for "love will cover a multitude of sins." Be hospitable to one another without grumbling. As each one has received a gift, minister it to one another, as good stewards of the manifold grace of God. If anyone speaks, let him speak as the oracles of God. If anyone ministers, let him do it as with the ability which God supplies, that in all things God may be glorified through Jesus Christ, to whom belong the glory and the dominion forever and ever. Amen.', reference: '1 Peter 4:8-11', category: 'love' },
    { id: '1-john-1-5-10', verse: 'This is the message which we have heard from Him and declare to you, that God is light and in Him is no darkness at all. If we say that we have fellowship with Him, and walk in darkness, we lie and do not practice the truth. But if we walk in the light as He is in the light, we have fellowship with one another, and the blood of Jesus Christ His Son cleanses us from all sin. If we say that we have no sin, we deceive ourselves, and the truth is not in us. If we confess our sins, He is faithful and just to forgive us our sins and to cleanse us from all unrighteousness. If we say that we have not sinned, we make Him a liar, and His word is not in us.', reference: '1 John 1:5-10', category: 'truth' },
    { id: 'rev-3-20', verse: 'Behold, I stand at the door and knock. If anyone hears My voice and opens the door, I will come in to him and dine with him, and he with Me. To him who overcomes I will grant to sit with Me on My throne, as I also overcame and sat down with My Father on His throne. He who has an ear, let him hear what the Spirit says to the churches.', reference: 'Revelation 3:20-22', category: 'invitation' }
  ],

  // Level 6: Medium length mixed (6 verses)
  6: [
    { id: 'matt-28-19-20', verse: 'Go therefore and make disciples of all the nations, baptizing them in the name of the Father', reference: 'Matthew 28:19-20', category: 'mission' },
    { id: 'john-14-6', verse: 'Jesus said to him, "I am the way, the truth, and the life"', reference: 'John 14:6', category: 'truth' },
    { id: 'acts-4-12', verse: 'Nor is there salvation in any other, for there is no other name under heaven', reference: 'Acts 4:12', category: 'salvation' },
    { id: 'rom-1-16', verse: 'For I am not ashamed of the gospel of Christ, for it is the power of God', reference: 'Romans 1:16', category: 'gospel' },
    { id: '1-cor-10-13', verse: 'No temptation has overtaken you except such as is common to man', reference: '1 Corinthians 10:13', category: 'temptation' },
    { id: 'james-1-22', verse: 'But be doers of the word, and not hearers only, deceiving yourselves', reference: 'James 1:22', category: 'obedience' }
  ],

  // Level 11: Advanced mixed (8 verses - very challenging)
  11: [
    { id: 'john-1-1-5', verse: 'In the beginning was the Word, and the Word was with God, and the Word was God. He was in the beginning with God. All things were made through Him, and without Him nothing was made that was made. In Him was life, and the life was the light of men. And the light shines in the darkness, and the darkness did not comprehend it.', reference: 'John 1:1-5', category: 'creation' },
    { id: 'rom-8-1-4', verse: 'There is therefore now no condemnation to those who are in Christ Jesus, who do not walk according to the flesh, but according to the Spirit. For the law of the Spirit of life in Christ Jesus has made me free from the law of sin and death. For what the law could not do in that it was weak through the flesh, God did by sending His own Son in the likeness of sinful flesh, on account of sin: He condemned sin in the flesh, that the righteous requirement of the law might be fulfilled in us who do not walk according to the flesh but according to the Spirit.', reference: 'Romans 8:1-4', category: 'freedom' },
    { id: 'eph-6-10-18', verse: 'Finally, my brethren, be strong in the Lord and in the power of His might. Put on the whole armor of God, that you may be able to stand against the wiles of the devil. For we do not wrestle against flesh and blood, but against principalities, against powers, against the rulers of the darkness of this age, against spiritual hosts of wickedness in the heavenly places. Therefore take up the whole armor of God, that you may be able to withstand in the evil day, and having done all, to stand.', reference: 'Ephesians 6:10-13', category: 'warfare' },
    { id: 'phil-2-1-11', verse: 'Therefore if there is any consolation in Christ, if any comfort of love, if any fellowship of the Spirit, if any affection and mercy, fulfill my joy by being like-minded, having the same love, being of one accord, of one mind. Let nothing be done through selfish ambition or conceit, but in lowliness of mind let each esteem others better than himself. Let each of you look out not only for his own interests, but also for the interests of others. Let this mind be in you which was also in Christ Jesus, who, being in the form of God, did not consider it robbery to be equal with God, but made Himself of no reputation, taking the form of a bondservant, and coming in the likeness of men.', reference: 'Philippians 2:1-7', category: 'humility' },
    { id: 'heb-11-1-6', verse: 'Now faith is the substance of things hoped for, the evidence of things not seen. For by it the elders obtained a good testimony. By faith we understand that the worlds were framed by the word of God, so that the things which are seen were not made of things which are visible. By faith Abel offered to God a more excellent sacrifice than Cain, through which he obtained witness that he was righteous, God testifying of his gifts; and through it he being dead still speaks. By faith Enoch was taken away so that he did not see death, "and was not found, because God had taken him"; for before he was taken he had this testimony, that he pleased God. But without faith it is impossible to please Him, for he who comes to God must believe that He is, and that He is a rewarder of those who diligently seek Him.', reference: 'Hebrews 11:1-6', category: 'faith' },
    { id: '1-pet-1-3-9', verse: 'Blessed be the God and Father of our Lord Jesus Christ, who according to His abundant mercy has begotten us again to a living hope through the resurrection of Jesus Christ from the dead, to an inheritance incorruptible and undefiled and that does not fade away, reserved in heaven for you, who are kept by the power of God through faith for salvation ready to be revealed in the last time. In this you greatly rejoice, though now for a little while, if need be, you have been grieved by various trials, that the genuineness of your faith, being much more precious than gold that perishes, though it is tested by fire, may be found to praise, honor, and glory at the revelation of Jesus Christ, whom having not seen you love. Though now you do not see Him, yet believing, you rejoice with joy inexpressible and full of glory, receiving the end of your faith—the salvation of your souls.', reference: '1 Peter 1:3-9', category: 'hope' },
    { id: '2-pet-1-3-11', verse: 'as His divine power has given to us all things that pertain to life and godliness, through the knowledge of Him who called us by glory and virtue, by which have been given to us exceedingly great and precious promises, that through these you may be partakers of the divine nature, having escaped the corruption that is in the world through lust. But also for this very reason, giving all diligence, add to your faith virtue, to virtue knowledge, to knowledge self-control, to self-control perseverance, to perseverance godliness, to godliness brotherly kindness, to brotherly kindness love. For if these things are yours and abound, you will be neither barren nor unfruitful in the knowledge of our Lord Jesus Christ. For he who lacks these things is shortsighted, even to blindness, and has forgotten that he was cleansed from his old sins. Therefore, brethren, be even more diligent to make your call and election sure, for if you do these things you will never stumble; for so an entrance will be supplied to you abundantly into the everlasting kingdom of our Lord and Savior Jesus Christ.', reference: '2 Peter 1:3-11', category: 'growth' },
    { id: 'jude-1-24-25', verse: 'Now to Him who is able to keep you from stumbling, And to present you faultless Before the presence of His glory with exceeding joy, To God our Savior, Who alone is wise, Be glory and majesty, Dominion and power, Both now and forever. Amen.', reference: 'Jude 1:24-25', category: 'doxology' }
  ],

  // Level 7: Medium to long mixed (6 verses)
  7: [
    { id: 'john-15-7', verse: 'If you abide in Me, and My words abide in you, you will ask what you desire', reference: 'John 15:7', category: 'prayer' },
    { id: 'rom-3-23-24', verse: 'for all have sinned and fall short of the glory of God, being justified freely by His grace', reference: 'Romans 3:23-24', category: 'salvation' },
    { id: '1-cor-15-3-4', verse: 'For I delivered to you first of all that which I also received: that Christ died for our sins', reference: '1 Corinthians 15:3-4', category: 'gospel' },
    { id: '2-cor-12-9', verse: 'And He said to me, "My grace is sufficient for you, for My strength is made perfect in weakness."', reference: '2 Corinthians 12:9', category: 'grace' },
    { id: 'gal-5-22-23', verse: 'But the fruit of the Spirit is love, joy, peace, longsuffering, kindness, goodness, faithfulness', reference: 'Galatians 5:22-23', category: 'spirit' },
    { id: 'heb-13-5', verse: 'Let your conduct be without covetousness; be content with such things as you have', reference: 'Hebrews 13:5', category: 'contentment' }
  ],

  // Level 12: Ultimate challenge (8 verses - maximum difficulty)
  12: [
    { id: 'john-1-12-18', verse: 'But as many as received Him, to them He gave the right to become children of God, to those who believe in His name: who were born, not of blood, nor of the will of the flesh, nor of the will of man, but of God. And the Word became flesh and dwelt among us, and we beheld His glory, the glory as of the only begotten of the Father, full of grace and truth. John bore witness of Him and cried out, saying, "This was He of whom I said, \'He who comes after me is preferred before me, for He was before me.\' " And of His fullness we have all received, and grace for grace. For the law was given through Moses, but grace and truth came through Jesus Christ. No one has seen God at any time. The only begotten Son, who is in the bosom of the Father, He has declared Him.', reference: 'John 1:12-18', category: 'incarnation' },
    { id: 'rom-8-28-39', verse: 'And we know that all things work together for good to those who love God, to those who are the called according to His purpose. For whom He foreknew, He also predestined to be conformed to the image of His Son, that He might be the firstborn among many brethren. Moreover whom He predestined, these He also called; whom He called, these He also justified; and whom He justified, these He also glorified. What then shall we say to these things? If God is for us, who can be against us? He who did not spare His own Son, but delivered Him up for us all, how shall He not with Him also freely give us all things? Who shall bring a charge against God\'s elect? It is God who justifies. Who is he who condemns? It is Christ who died, and furthermore is also risen, who is even at the right hand of God, who also makes intercession for us. Who shall separate us from the love of Christ? Shall tribulation, or distress, or persecution, or famine, or nakedness, or peril, or sword? As it is written: "For Your sake we are killed all day long; We are accounted as sheep for the slaughter." Yet in all these things we are more than conquerors through Him who loved us. For I am persuaded that neither death nor life, nor angels nor principalities nor powers, nor things present nor things to come, nor height nor depth, nor any other created thing, shall be able to separate us from the love of God which is in Christ Jesus our Lord.', reference: 'Romans 8:28-39', category: 'security' },
    { id: 'eph-1-3-14', verse: 'Blessed be the God and Father of our Lord Jesus Christ, who has blessed us with every spiritual blessing in the heavenly places in Christ, just as He chose us in Him before the foundation of the world, that we should be holy and without blame before Him in love, having predestined us to adoption as sons by Jesus Christ to Himself, according to the good pleasure of His will, to the praise of the glory of His grace, by which He made us accepted in the Beloved. In Him we have redemption through His blood, the forgiveness of sins, according to the riches of His grace which He made to abound toward us in all wisdom and prudence, having made known to us the mystery of His will, according to His good pleasure which He purposed in Himself, that in the dispensation of the fullness of the times He might gather together in one all things in Christ, both which are in heaven and which are on earth—in Him. In Him also we have obtained an inheritance, being predestined according to the purpose of Him who works all things according to the counsel of His will, that we who first trusted in Christ should be to the praise of His glory. In Him you also trusted, after you heard the word of truth, the gospel of your salvation; in whom also, having believed, you were sealed with the Holy Spirit of promise, who is the guarantee of our inheritance until the redemption of the purchased possession, to the praise of His glory.', reference: 'Ephesians 1:3-14', category: 'blessing' },
    { id: 'phil-2-5-11', verse: 'Let this mind be in you which was also in Christ Jesus, who, being in the form of God, did not consider it robbery to be equal with God, but made Himself of no reputation, taking the form of a bondservant, and coming in the likeness of men. And being found in appearance as a man, He humbled Himself and became obedient to the point of death, even the death of the cross. Therefore God also has highly exalted Him and given Him the name which is above every name, that at the name of Jesus every knee should bow, of those in heaven, and of those on earth, and of those under the earth, and that every tongue should confess that Jesus Christ is Lord, to the glory of God the Father.', reference: 'Philippians 2:5-11', category: 'exaltation' },
    { id: 'col-1-9-20', verse: 'For this reason we also, since the day we heard it, do not cease to pray for you, and to ask that you may be filled with the knowledge of His will in all wisdom and spiritual understanding; that you may walk worthy of the Lord, fully pleasing Him, being fruitful in every good work and increasing in the knowledge of God; strengthened with all might, according to His glorious power, for all patience and longsuffering with joy; giving thanks to the Father who has qualified us to be partakers of the inheritance of the saints in the light. He has delivered us from the power of darkness and conveyed us into the kingdom of the Son of His love, in whom we have redemption through His blood, the forgiveness of sins. He is the image of the invisible God, the firstborn over all creation. For by Him all things were created that are in heaven and that are on earth, visible and invisible, whether thrones or dominions or principalities or powers. All things were created through Him and for Him. And He is before all things, and in Him all things consist.', reference: 'Colossians 1:9-17', category: 'supremacy' },
    { id: '1-tim-3-14-16', verse: 'These things I write to you, though I hope to come to you shortly; but if I am delayed, I write so that you may know how you ought to conduct yourself in the house of God, which is the church of the living God, the pillar and ground of the truth. And without controversy great is the mystery of godliness: God was manifested in the flesh, Justified in the Spirit, Seen by angels, Preached among the Gentiles, Believed on in the world, Received up in glory.', reference: '1 Timothy 3:14-16', category: 'mystery' },
    { id: 'titus-2-11-14', verse: 'For the grace of God that brings salvation has appeared to all men, teaching us that, denying ungodliness and worldly lusts, we should live soberly, righteously, and godly in the present age, looking for the blessed hope and glorious appearing of our great God and Savior Jesus Christ, who gave Himself for us, that He might redeem us from every lawless deed and purify for Himself His own special people, zealous for good works.', reference: 'Titus 2:11-14', category: 'grace' },
    { id: 'heb-12-1-3', verse: 'Therefore we also, since we are surrounded by so great a cloud of witnesses, let us lay aside every weight, and the sin which so easily ensnares us, and let us run with endurance the race that is set before us, looking unto Jesus, the author and finisher of our faith, who for the joy that was set before Him endured the cross, despising the shame, and has sat down at the right hand of the throne of God. For consider Him who endured such hostility from sinners against Himself, lest you become weary and discouraged in your souls.', reference: 'Hebrews 12:1-3', category: 'endurance' }
  ]
};

// Sequential level progression: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12
export const levelProgression = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Helper function to get verses for a specific level
export const getVersesForLevel = (level: number): BibleVerse[] => {
  return bibleVersesByLevel[level] || [];
};

// Helper function to get total number of levels
export const getTotalLevels = (): number => {
  return levelProgression.length;
};
