CREATE DATABASE  IF NOT EXISTS `portfolio_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `portfolio_db`;
-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: portfolio_db
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `project_media`
--

DROP TABLE IF EXISTS `project_media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_media` (
  `media_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `media_type` enum('image','video') NOT NULL,
  `media_path` varchar(255) NOT NULL,
  `media_description` text,
  `sort_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`media_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `project_media_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_media`
--

LOCK TABLES `project_media` WRITE;
/*!40000 ALTER TABLE `project_media` DISABLE KEYS */;
INSERT INTO `project_media` VALUES (1,1,'image','/uploads/1765183945976-109769031-instagram-grid-template-3x3_Final.png','I used the sky as the background as it signifies flying overseas. It also helps to crate a light and open feeling associated with travel. I also tried to make the poster symmetrical by arranging the location of travel in the a hexagonal shape at the top bottom left and right middle of the post. The color palette used is mainly sky blue, white and natural tones than is in the photos. This posters also showcases the global destination as well as the min attraction that customer will be visiting. I place the call to action to the bottom right of the page as I feel it aligns with the natural reading flow making it the last thing the viewer sees after looking at the destinations. \r\n',1,'2025-12-08 08:52:25'),(2,2,'image','/uploads/1765187871537-513048575-Digital_Banner.png','I wanted a simple and clean banner. The phrase “Where Developer Meets Designer ” shows my passion in both coding as well as design. I use blue ops to represent developer and softer pink/purple for the designer side. The floating shapes help show how both parts can work together in a calm, balanced way without being too flashy.\r\n',1,'2025-12-08 09:57:51'),(3,4,'video','/uploads/1765189566387-91856340-Screenrecord_20250729_170905.mp4','Full Escape Room VR Game recoding ',1,'2025-12-08 10:26:06'),(4,4,'image','/uploads/1765189566770-813075000-EscapeRoom.webp','',6,'2025-12-08 10:26:06'),(5,4,'image','/uploads/1765189566768-13432442-âWelcome to the Asylum.âThe truth was shattered long ago. Find_.png','Puzzle 4 of 4:\r\nThis puzzle requires all 3 pieces of the puzzle pieces found in the previous rooms to be place. This will then allow the player to interact with the statue where a hidden portal lies which will then teleport the user to the escaped room.\r\n',5,'2025-12-08 10:26:06'),(6,4,'image','/uploads/1765189566766-860176359-board.png','Puzzle 2 of 4:\r\nThis puzzle is held inside the morgue room. In this room players will look at a board with dates the will have to add up the days and the month of death of the patients names and equate them to the year. Only 4 name will equate to the year. Then they will select the 4 doors that they need to press in the order of the years to unlock the last morgue door to retrieve the 2nd puzzle piece for the 4th puzzle an also place the slab on the statue..\r\n',3,'2025-12-08 10:26:06'),(7,4,'image','/uploads/1765189566765-510348569-boardLight.png','Puzzle 1 of 4: \r\nIn the first room, this is also where you will spawn in. This room puzzle requires users to look at the hint given maybe above a door to click 8 candle lights inside the room in a specific order in order to unlock the door to escape. After solving the puzzle players can exit the room through clicking the door. They will also have to pick up a stone slab which will hint them to where the next puzzle will take place and also place the slab at the statue.\r\n',2,'2025-12-08 10:26:06'),(8,4,'image','/uploads/1765189566767-628999591-boardCode.png','Puzzle 3 of 4:\r\nThe 3rd puzzle will require the user get 5 numbers from the board to key into the keypad to unlock the door to the doctors office in there will be the last and final piece of the puzzle for the statue.\r\n',4,'2025-12-08 10:26:06'),(10,6,'image','/uploads/1765191988659-635446897-Figma_All_Pages.png','',1,'2025-12-08 11:06:28'),(11,6,'image','/uploads/1765191988662-248909267-Home.png','',2,'2025-12-08 11:06:28');
/*!40000 ALTER TABLE `project_media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `project_id` int NOT NULL AUTO_INCREMENT,
  `project_name` varchar(150) NOT NULL,
  `project_short_description` varchar(255) NOT NULL,
  `project_type` enum('development','design') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `cover_image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`project_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (1,'Instagram Grid','3x3 Instagram Design ','design','2025-12-08 08:52:25','/uploads/1765183945976-109769031-instagram-grid-template-3x3_Final.png'),(2,'Digital Banner','Digital banner for my portfolio website','design','2025-12-08 09:57:51','/uploads/1765187871537-513048575-Digital_Banner.png'),(4,'VR Escape Room Game','C337_Immersive Technologies Escape room GA','development','2025-12-08 10:26:06','/uploads/1765189566770-813075000-EscapeRoom.webp'),(6,'Sustainable Shopping Webpage (Figma)','Figma design for sustainable shopping app ','design','2025-12-08 11:06:28','/uploads/1765191988662-248909267-Home.png');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-09 11:39:45
