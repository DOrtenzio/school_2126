-- phpMyAdmin SQL Dump
-- version 4.8.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Creato il: Apr 14, 2020 alle 21:11
-- Versione del server: 10.1.34-MariaDB
-- Versione PHP: 7.2.7

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `todoapp`
--

-- --------------------------------------------------------

--
-- Struttura della tabella `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dump dei dati per la tabella `categories`
--

INSERT INTO `categories` (`id`, `name`) VALUES
(1, 'fun'),
(2, 'work');

-- --------------------------------------------------------

--
-- Struttura della tabella `lists`
--

CREATE TABLE `lists` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dump dei dati per la tabella `lists`
--

INSERT INTO `lists` (`id`, `date`) VALUES
(1, '2020-03-24'),
(2, '2020-03-27');

-- --------------------------------------------------------

--
-- Struttura della tabella `listsmemberships`
--

CREATE TABLE `listsmemberships` (
  `id` int(11) NOT NULL,
  `listId` int(11) NOT NULL,
  `userId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dump dei dati per la tabella `listsmemberships`
--

INSERT INTO `listsmemberships` (`id`, `listId`, `userId`) VALUES
(1, 1, 1),
(2, 2, 2);

-- --------------------------------------------------------

--
-- Struttura della tabella `todos`
--

CREATE TABLE `todos` (
  `id` bigint(11) NOT NULL,
  `name` varchar(40) NOT NULL,
  `isComplete` bit(1) NOT NULL,
  `categoryId` int(11) NOT NULL,
  `listId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dump dei dati per la tabella `todos`
--

INSERT INTO `todos` (`id`, `name`, `isComplete`, `categoryId`, `listId`) VALUES
(1, 'Leggere', b'0', 1, 1),
(2, 'Studiare', b'1', 2, 2),
(4, 'walk dog', b'1', 1, 1),
(7, 'walk dog', b'1', 1, 2);

-- --------------------------------------------------------

--
-- Struttura della tabella `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `surname` varchar(200) NOT NULL,
  `email` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dump dei dati per la tabella `users`
--

INSERT INTO `users` (`id`, `name`, `surname`, `email`) VALUES
(1, 'diego', 'bernini', 'diego.bernini@itispaleocapa.it'),
(2, 'dafne', 'belmonte', 'dafne.belmonte@itispaleocapa.it');

--
-- Indici per le tabelle scaricate
--

--
-- Indici per le tabelle `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indici per le tabelle `lists`
--
ALTER TABLE `lists`
  ADD PRIMARY KEY (`id`);

--
-- Indici per le tabelle `listsmemberships`
--
ALTER TABLE `listsmemberships`
  ADD PRIMARY KEY (`id`),
  ADD KEY `LM_LIST_FK` (`listId`),
  ADD KEY `lm_user_fk` (`userId`);

--
-- Indici per le tabelle `todos`
--
ALTER TABLE `todos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `todos_categories_fk` (`categoryId`),
  ADD KEY `todos_lists_fk` (`listId`);

--
-- Indici per le tabelle `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT per le tabelle scaricate
--

--
-- AUTO_INCREMENT per la tabella `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT per la tabella `lists`
--
ALTER TABLE `lists`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT per la tabella `todos`
--
ALTER TABLE `todos`
  MODIFY `id` bigint(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT per la tabella `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Limiti per le tabelle scaricate
--

--
-- Limiti per la tabella `listsmemberships`
--
ALTER TABLE `listsmemberships`
  ADD CONSTRAINT `LM_LIST_FK` FOREIGN KEY (`listId`) REFERENCES `lists` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `lm_user_fk` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Limiti per la tabella `todos`
--
ALTER TABLE `todos`
  ADD CONSTRAINT `todos_categories_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `todos_lists_fk` FOREIGN KEY (`listId`) REFERENCES `lists` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
