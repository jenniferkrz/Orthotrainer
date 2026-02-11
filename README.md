# ORCA Ortho Campus

Webbasierte Lernplattform für die kieferorthopädische Ausbildung. Studierende analysieren medizinische Bilder (Röntgenbilder, Gesichtsfotos, 3D-Modelle), führen kephalometrische Analysen durch und bearbeiten klinische Fälle.

## Voraussetzungen

- Apache Webserver mit `mod_rewrite`
- PHP 8.x
- MySQL / MariaDB

## Installation

### 1. Dateien kopieren

Den Ordner `app/` in das gewünschte Verzeichnis auf dem Webserver kopieren, z. B.:

```
/var/www/html/app/ORCA_ortho_campus/
```

### 2. Datenbank einrichten

Die mitgelieferte `database.sql` importieren:

```bash
mysql -u root -p < database.sql
```

Dies erstellt die Datenbank `kfo` mit allen Tabellen und 3 Cases.

### 3. Konfiguration anpassen

Die Datei `app/php/config.php` öffnen und die Datenbank-Zugangsdaten anpassen:

```php
<?php
$host = "localhost";
$username = "DEIN_DB_USER";
$password = "DEIN_DB_PASSWORT";
$database = "kfo";
```

### 4. Berechtigungen setzen

Der Webserver benötigt Schreibrechte auf den Upload-Ordner:

```bash
chown -R www-data:www-data /var/www/html/moodle/app/ORCA_ortho_campus/
```

## Projektstruktur

```
ORCA_ortho_campus/
├── db.sql                  # Datenbank-Dump
├── README.md
└── app/
    ├── index.php           # Einstiegspunkt
    ├── php/
    │   ├── config.php      # Datenbank-Konfiguration
    │   ├── getCases.php
    │   ├── saveValues.php
    │   └── ...
    ├── js/                 # Frontend-Logik
    ├── css/                # Stylesheets
    └── uploads/            # Fallbilder und 3D-Modelle
```

## Enthaltene Beispiel-Cases

| ID | Name            | Alter     | Beschreibung                    |
|----|-----------------|----------|---------------------------------|
| 6  | Dana Distel     | 16 Jahre | Angle-Klasse II/2, Engstand     |
| 7  | Martin Mesner   | 32 Jahre | Angle-Klasse III, Progenie      |
| 13 | Paul Platzner   | 14 Jahre | Angle-Klasse II/2, Ektopie 13   |

## Hinweise

- Die Tabellen `Results` und `user_progress` sind leer und werden im Betrieb mit Studentendaten befüllt.