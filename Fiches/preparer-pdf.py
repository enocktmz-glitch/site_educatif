#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
preparer-pdf.py : prépare les PDF avant de les envoyer dans Supabase Storage.

Pourquoi ? Les noms de tes PDF contiennent des espaces, des accents et parfois des
caractères corrompus : Supabase les refuserait. Ce script copie chaque PDF sous un
nom simple (ex. svt/l1-le-reflexe-conditionnel.pdf) dans un dossier "a-uploader".
Tes fichiers d'origine ne sont ni modifiés ni supprimés.

Utilisation :
  1. Place ce fichier dans ton dossier Fiches/ (à côté de svt.html, maths.html...).
  2. Ouvre un terminal dans ce dossier et lance :   python preparer-pdf.py
     (sous Windows, si "python" ne marche pas :       py preparer-pdf.py)
  3. Envoie ensuite le contenu du dossier "a-uploader" dans Supabase.
"""
import difflib
import shutil
import sys
import unicodedata
from pathlib import Path

try:
    sys.stdout.reconfigure(errors="replace")   # évite les erreurs d'affichage sous Windows
except Exception:
    pass

BASE = Path(__file__).resolve().parent
SORTIE = BASE / "a-uploader"

# (nom simple dans Supabase, emplacement actuel du PDF depuis le dossier Fiches/)
FICHIERS = [
    ("svt/l1-le-reflexe-conditionnel.pdf", "Fiches SVT/SVT TD_L1_Le reflexe conditionnel.pdf"),
    ("svt/l2-le-fonctionnement-du-tissu-nerveux.pdf", "Fiches SVT/SVT TD_L2_Le fonctionnement du  tissu nerveux.pdf"),
    ("svt/l4-le-fonctionnement-du-coeur.pdf", "Fiches SVT/SVT TD_L4_Le fonctionnement du coeur.pdf"),
    ("svt/l5-le-maintien-de-la-constance-du-milieu-interieur.pdf", "Fiches SVT/SVT TD_L5_Le maintien de la constance du milieu int閞ieur (4).pdf"),
    ("svt/l6-le-systeme-de-defense-de-l-organisme.pdf", "Fiches SVT/SVT TD_L6_Le systeme de defense de lorganisme.pdf"),
    ("svt/l7-l-infection-de-l-organisme-par-le-vih.pdf", "Fiches SVT/SVT TD_L7_Linfection de lorganisme p鈘 le VIH.pdf"),
    ("svt/l8-le-devenir-des-cellules-sexuelles-chez-les-mammiferes.pdf", "Fiches SVT/SVT TD_L8_Le devenir des cellules sexuelles chez les mammif鑢es.pdf"),
    ("svt/l9-le-fonctionnement-des-organes-sexuels-chez-l-homme.pdf", "Fiches SVT/SVT TD_L9_Le fonctionnement des organes sexuels chez lHomme (ok).pdf"),
    ("svt/l10-la-reproduction-chez-les-spermaphytes.pdf", "Fiches SVT/SVT TD_L10_La reproduction chez les spermaphytes.pdf"),
    ("svt/l11-la-transmission-d-un-caractere-hereditaire-chez-l-homme.pdf", "Fiches SVT/SVT TD_L11_La transmission dun caract鑢e h閞閐itaire chez lHomme.pdf"),
    ("svt/l12-la-transmission-de-deux-caracteres-hereditaires-chez-les.pdf", "Fiches SVT/SVT TD_L12_La transmission de deux caract鑢es h閞閐itaires ches les 阾res vivants.p.pdf"),
    ("svt/l14-l-exploitation-des-gisements-miniers.pdf", "Fiches SVT/SVT TD_L14_Lexploitation des gisements miniers.pdf"),
    ("svt/l15-l-amelioration-et-la-protection-des-sols.pdf", "Fiches SVT/SVT TD_L15_Lam閘ioration et la protection des sols.pdf"),
    ("maths/l01-limites-et-continuite.pdf", "Fiches MATHS/TD Maths lecon 01 LIMITES ET CONTINUITE.pdf"),
    ("maths/l02-probabilite.pdf", "Fiches MATHS/TD Maths le鏾n 02 Probabilit開1.pdf"),
    ("maths/l03-derivabilite-et-etude-de-fonctions.pdf", "Fiches MATHS/TD Maths le鏾n 03 DERIVABILITE ET ETUDE DE FONCTIONS.pdf"),
    ("maths/l04-primitives.pdf", "Fiches MATHS/TD Maths lecon 04 PRIMITIVES.pdf"),
    ("maths/l05-fonctions-logarithmes.pdf", "Fiches MATHS/TD Maths le鏾n 05 FONCTIONS LOGARITHMES.pdf"),
    ("maths/l08-nombres-complexes-et-geometrie-du-plan.pdf", "Fiches MATHS/TD Maths lecon 08 Nombres complexes et geometrie du plan.pdf"),
    ("physique/l1-cinematique-du-point.pdf", "Fiches PHYSIQUE/TleD_PHY_L1_Cinématique du point.pdf"),
    ("physique/l2-mouvement-du-centre-d-inertie-d-un-solide.pdf", "Fiches PHYSIQUE/TleD_PHY_L2_Mouvement du centre dinertie dun solide.pdf"),
    ("physique/l3-interaction-gravitationnelle.pdf", "Fiches PHYSIQUE/TleD_PHY_L3_Interaction gravitationnelle.pdf"),
    ("physique/l4-mouvement-dans-les-champs-g-et-e-uniformes.pdf", "Fiches PHYSIQUE/TleD_PHY_L4_Mouvement dans les champs g et E uniformes.pdf"),
    ("physique/l5-oscillations-mecaniques-libres.pdf", "Fiches PHYSIQUE/TleD_PHY_L5_Oscillations mécaniques libres.pdf"),
    ("physique/l6-champ-magnetique.pdf", "Fiches PHYSIQUE/TleD_PHY_L6_Champ magnétique.pdf"),
    ("physique/l8-loi-de-laplace.pdf", "Fiches PHYSIQUE/TleD_PHY_L8_Loi de Laplace.pdf"),
    ("physique/l9-induction-electromagnetique.pdf", "Fiches PHYSIQUE/TleD_PHY_L9_Induction électromagnétique.pdf"),
    ("physique/l11-montages-derivateur-et-integrateur.pdf", "Fiches PHYSIQUE/TleD_PHY_L11_Montages dérivateur et iontégrateur.pdf"),
    ("physique/l13-circuit-rlc-en-regime-sinusoidal-force.pdf", "Fiches PHYSIQUE/TleD_PHY_L13_Circuit RLC en régime sinusoïdal forcé.pdf"),
    ("physique/l14-resonance-d-intensite.pdf", "Fiches PHYSIQUE/TleD_PHY_L14_Résonance  dintensité.pdf"),
    ("physique/l16-modele-ondulatoire-de-la-lumiere.pdf", "Fiches PHYSIQUE/TleD_PHY_L16_Modèle ondulatoire de la lumière.pdf"),
    ("physique/l18-reactions-nucleaires-spontanees.pdf", "Fiches PHYSIQUE/TleD_PHY_L18_Réactions nucléires spontanées.pdf"),
    ("physique/l19-reactions-nucleaires-provoquees.pdf", "Fiches PHYSIQUE/TleD_PHY_L19_Réactions nucléaires provoquées.pdf"),
    ("chimie/l1-les-alcools.pdf", "Fiches CHIMIE/TleD_CH_L1_Les alcools.pdf"),
    ("chimie/l2-composes-carbonyles.pdf", "Fiches CHIMIE/TleD_CH_L2_Composés carbonylés.pdf"),
    ("chimie/l3-les-amines.pdf", "Fiches CHIMIE/TleD_CH_L3_ Les amines.pdf"),
    ("chimie/l4-acides-carboxyliques-et-derives.pdf", "Fiches CHIMIE/TleD_CH_L4_Acides carboxyliques et dérivés.pdf"),
    ("chimie/l5-fabrication-d-un-savon.pdf", "Fiches CHIMIE/TleD_CH_L5_Fabrication dun savon (1).pdf"),
    ("chimie/l6-solutions-aqueuses-notion-de-ph.pdf", "Fiches CHIMIE/TleD_CH_L6_Solutions aqueuses-Notion de  pH (2).pdf"),
    ("chimie/l7-acide-fort-base-forte.pdf", "Fiches CHIMIE/TleD_CH_L7_Acide fort-base forte (2).pdf"),
    ("chimie/l8-acide-faible-base-faible.pdf", "Fiches CHIMIE/TleD_CH_L8_Acide faible base faible (1).pdf"),
    ("chimie/l9-couple-acide-base.pdf", "Fiches CHIMIE/TleD_CH_L9_Couple acide-base.pdf"),
    ("chimie/l10-reactions-acidobasiques-solutions-tampons.pdf", "Fiches CHIMIE/TleD_CH_L10_Réactions acidobasiques. Solutions tampons.pdf"),
    ("chimie/l11-dosage-acido-basique.pdf", "Fiches CHIMIE/TleD_CH_L11_Dosage Acido-Basique (2).pdf"),
    ("chimie/l12-acides-alpha-amines.pdf", "Fiches CHIMIE/TleD_CH_L12_Acides alpha aminés (1).pdf"),
    ("philo/l1-la-dissertation-philosophique.pdf", "Fiches PHILO/Tle_Philo_L1_La dissertation philosophique.pdf"),
    ("philo/l2-le-commentaire-de-texte-philosophique.pdf", "Fiches PHILO/Tle_Philo_L2_Le commentataire de texte philosophique.pdf"),
    ("philo/l3-la-connaissance-de-l-homme.pdf", "Fiches PHILO/Tle_Philo_L3_La connaissance de lhomme.pdf"),
    ("philo/l4-la-vie-en-societe.pdf", "Fiches PHILO/Tle_Philo_L4_La vie en société.pdf"),
    ("philo/l5-dieu-et-la-religion.pdf", "Fiches PHILO/Tle_Philo_L5_Dieu et la réligion.pdf"),
    ("philo/l6-l-histoire-et-l-humanite.pdf", "Fiches PHILO/Tle_Philo_L6_Lhistoire et lhumanité.pdf"),
    ("philo/l7-la-valeur-de-la-philosophie.pdf", "Fiches PHILO/Tle_Philo_L7_La valeur de la philosophie.pdf"),
    ("philo/l8-progres-et-bonheur.pdf", "Fiches PHILO/Tle_Philo_L8_Progrès et Bonheur.pdf"),
    ("philo/l9-langage-et-verite.pdf", "Fiches PHILO/Tle_Philo_L9_Langage et Vérité.pdf"),
    ("philo/l10-la-connaissance-scientifique.pdf", "Fiches PHILO/Tle_Philo_L10_La Connaissance scientifique.pdf"),
    ("histoire-geo/g1-les-fondements-du-developpement-economique-de-la-cote-d.pdf", "Fiches HISTOIRE-GEOGRAPHIE/Tle G1_Les fondements du developpement économique de la Côte dIvoire.pdf"),
    ("histoire-geo/g2-les-secteurs-d-activites-economiques-de-la-cote-d-ivoire.pdf", "Fiches HISTOIRE-GEOGRAPHIE/Tle G2_Les secteurs dactivités économiques de la Côte dIvoire.pdf"),
    ("histoire-geo/g3-les-problemes-de-developpement-economique-de-la-cote-d.pdf", "Fiches HISTOIRE-GEOGRAPHIE/Tle G3_Les problèmes de développement économique de la Côte dIvoire.pdf"),
    ("histoire-geo/g4-les-fondements-du-developpement-economique-de-la-coree-du.pdf", "Fiches HISTOIRE-GEOGRAPHIE/Tle G4_Les fondements du développement économique de la corée du Sud.pdf"),
    ("histoire-geo/g6-la-cedeao-une-organisation-regionale-a-caractere-economique.pdf", "Fiches HISTOIRE-GEOGRAPHIE/Tle G6_La CEDEAO une organisation régionale à caractère économique.pdf"),
    ("histoire-geo/h1-l-organisation-des-nations-unies-onu.pdf", "Fiches HISTOIRE-GEOGRAPHIE/Tle H1-LOrganisation des Nations Unies(ONU).pdf"),
    ("histoire-geo/h2-l-ere-de-la-bipolarisation-de-1947-a-1991.pdf", "Fiches HISTOIRE-GEOGRAPHIE/Tle H2- Lère de la bipolarisation de 1947 à 1991.pdf"),
    ("histoire-geo/h3-de-la-fin-de-la-guerre-froide-vers-un-monde-multipolaire.pdf", "Fiches HISTOIRE-GEOGRAPHIE/Tle H3-De la fin de la guerre froide vers un monde multipolaire.pdf"),
    ("histoire-geo/h4-la-montee-des-nationalismes.pdf", "Fiches HISTOIRE-GEOGRAPHIE/Tle H4-la montée des nationalismes ok.pdf"),
    ("histoire-geo/h5-l-accession-de-la-cote-d-ivoire-a-l-independance.pdf", "Fiches HISTOIRE-GEOGRAPHIE/Tle H5-LAccession de la Côte dIvoire à lindépendance.pdf"),
    ("histoire-geo/h7-l-union-africaine.pdf", "Fiches HISTOIRE-GEOGRAPHIE/Tle H7-L Union Africaine.pdf")
]


def nfc(texte):
    return unicodedata.normalize("NFC", texte)


def trouver_dossier(nom):
    direct = BASE / nom
    if direct.is_dir():
        return direct
    for enfant in BASE.iterdir():
        if enfant.is_dir() and nfc(enfant.name) == nfc(nom):
            return enfant
    return None


def trouver_pdf(chemin, deja_pris):
    """Retourne (fichier, approximatif) ou (None, False)."""
    dossier_nom, _, fichier_nom = chemin.partition("/")
    dossier = trouver_dossier(dossier_nom)
    if dossier is None:
        return None, False
    exact = dossier / fichier_nom
    if exact.is_file() and exact not in deja_pris:
        return exact, False
    candidats = [f for f in dossier.iterdir()
                 if f.is_file() and f.suffix.lower() == ".pdf" and f not in deja_pris]
    for f in candidats:
        if nfc(f.name) == nfc(fichier_nom):
            return f, False
    proches = difflib.get_close_matches(fichier_nom, [f.name for f in candidats], n=1, cutoff=0.75)
    if proches:
        return dossier / proches[0], True
    return None, False


def main():
    ok, approx, manquants, octets = [], [], [], 0
    pris = set()
    for cle, original in FICHIERS:
        source, approximatif = trouver_pdf(original, pris)
        if source is None:
            manquants.append((cle, original))
            continue
        pris.add(source)
        cible = SORTIE / cle
        cible.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, cible)
        octets += source.stat().st_size
        (approx if approximatif else ok).append((cle, source.name))

    print()
    print("PDF prêts dans le dossier :", SORTIE)
    print("  - trouvés exactement  :", len(ok))
    print("  - trouvés par approximation (à vérifier) :", len(approx))
    print("  - introuvables        :", len(manquants))
    print("  - taille totale       : %.1f Mo" % (octets / 1048576))

    if approx:
        print("\nÀ VÉRIFIER (le nom ressemblait, mais n'était pas identique) :")
        for cle, nom in approx:
            print("  ", cle, "<-", nom)
    if manquants:
        print("\nINTROUVABLES (le fichier n'existe pas ou a un autre nom) :")
        for cle, original in manquants:
            print("  ", cle, "<- attendu :", original)
        print("Renomme/ajoute ces fichiers puis relance le script.")


if __name__ == "__main__":
    main()
