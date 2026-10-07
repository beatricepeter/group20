import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import governmentLogo from '../assets/logo3.png';
import heroImageOne from '../assets/recpter1.png';
import heroImageTwo from '../assets/recepter2.png';
import heroImageThree from '../assets/recepter3.png';
import receptionImage from '../assets/recepter2.png';
import '../styles/HomeTravel.css';

const heroImages = [heroImageOne, heroImageTwo, heroImageThree];

const visitSteps = [
	{ number: '01', title: 'Usajili wa mgeni', description: 'Taarifa na utambulisho wa mgeni huingizwa kwenye mfumo.' },
	{ number: '02', title: 'Uelekezaji wa ziara', description: 'Mgeni huunganishwa na mtaalamu anayetarajiwa kumhudumia.' },
	{ number: '03', title: 'Kumbukumbu salama', description: 'Ziara huhifadhiwa ili kurahisisha ufuatiliaji na ripoti.' },
];

export default function Home() {
	const [menuOpen, setMenuOpen] = useState(false);
	const [activeHeroImage, setActiveHeroImage] = useState(0);
	const closeMenu = () => setMenuOpen(false);

	useEffect(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

		const intervalId = window.setInterval(() => {
			setActiveHeroImage((index) => (index + 1) % heroImages.length);
		}, 5000);

		return () => window.clearInterval(intervalId);
	}, []);

	return (
		<main className="home-page">
			<section className="home-hero" id="mwanzo" aria-labelledby="home-title">
				{heroImages.map((image, index) => (
					<div
						className={`home-hero-background${index === activeHeroImage ? ' is-active' : ''}`}
						key={image}
						style={{ backgroundImage: `url(${image})` }}
						aria-hidden="true"
					/>
				))}
				<header className="home-header">
					<Link className="home-brand" to="/" aria-label="Mamlaka ya Serikali Mtandao Zanzibar, mwanzo" onClick={closeMenu}>
						<img className="home-brand-egov" src={governmentLogo} alt="" />
						<span className="home-brand-name">Serikali Mtandao<span>Zanzibar</span></span>
					</Link>
					<button className="home-menu-toggle" type="button" aria-label={menuOpen ? 'Funga menyu' : 'Fungua menyu'} aria-expanded={menuOpen} aria-controls="home-navigation" onClick={() => setMenuOpen((open) => !open)}>
						<span /><span /><span />
					</button>
					<nav className={`home-navigation${menuOpen ? ' is-open' : ''}`} id="home-navigation" aria-label="Menyu kuu">
						<a href="#mwanzo" onClick={closeMenu}>Home</a>
						<a href="#kuhusu" onClick={closeMenu}>About</a>
						<a href="#hatua" onClick={closeMenu}>How to Use</a>
						<a href="#mawasiliano" onClick={closeMenu}>Contact</a>
						<Link className="home-nav-login" to="/login" onClick={closeMenu}>Login <span aria-hidden="true">↗</span></Link>
					</nav>
				</header>

				<div className="home-hero-content">
					<p className="home-hero-kicker">MAMLAKA YA SERIKALI MTANDAO ZANZIBAR</p>
					<h1 id="home-title">Karibu kwenye huduma ya <span>usimamizi wa wageni</span></h1>
					<p className="home-welcome">Tunawakaribisha wageni kwa huduma yenye mpangilio. Sajili ziara, elekeza mgeni kwa mtaalamu husika na hifadhi kumbukumbu kwa urahisi.</p>
					<div className="home-hero-actions">
						<Link className="home-primary-action" to="/login">Get Started <span aria-hidden="true">→</span></Link>
						<span className="home-access-note">Kwa watumishi walioidhinishwa</span>
					</div>
				</div>
				<span className="home-hero-location">ZANZIBAR · TANZANIA</span>
			</section>

			<section className="home-overview" id="kuhusu" aria-labelledby="home-overview-title">
				<div className="home-overview-image-wrap">
					<img className="home-overview-image" src={receptionImage} alt="Mhudumu akimpokea mgeni katika mapokezi" loading="lazy" />
					<div className="home-image-label"><span>eGAZ</span> Huduma kwa wageni</div>
				</div>
				<div className="home-overview-intro">
					<p className="home-section-kicker">KUHUSU MFUMO</p>
					<h2 id="home-overview-title">Mapokezi yenye mpangilio, kuanzia hatua ya kwanza.</h2>
					<p className="home-overview-text">Mfumo huu husaidia watumishi kurekodi ziara, kumwelekeza mgeni kwa mtaalamu anayemtembelea na kupata kumbukumbu za wageni kwa urahisi.</p>
					<div className="home-service-points" id="huduma">
						<div><span>01</span><p><strong>Usajili rahisi</strong><br />Taarifa za mgeni huingizwa sehemu moja.</p></div>
						<div><span>02</span><p><strong>Uelekezaji wa ziara</strong><br />Mtaalamu na madhumuni ya ziara hujulikana.</p></div>
					</div>
				</div>
			</section>

			<section className="home-how" id="hatua" aria-labelledby="home-how-title">
				<div className="home-how-heading">
					<p className="home-section-kicker">HATUA ZA HUDUMA</p>
					<h2 id="home-how-title">Ziara inafuatiliwa kwa urahisi.</h2>
				</div>
				<div className="home-steps">
					{visitSteps.map((step) => (
						<article className="home-step" key={step.number}>
							<span className="home-step-number">{step.number}</span>
							<div><h3>{step.title}</h3><p>{step.description}</p></div>
						</article>
					))}
				</div>
			</section>

			<footer className="home-footer" id="mawasiliano">
				<span>Mamlaka ya Serikali Mtandao Zanzibar (eGAZ)</span>
				<span>Karibu, tunafurahi kukuhudumia.</span>
			</footer>
		</main>
	);
}
