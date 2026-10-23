-- Rode este script no SSMS / extensão SQL Server do VSCode
CREATE DATABASE UnivilleSalas;
GO
USE UnivilleSalas;
GO
CREATE TABLE Usuarios (
  Id INT IDENTITY PRIMARY KEY,
  Nome NVARCHAR(100) NOT NULL,
  Identificador NVARCHAR(120) NOT NULL UNIQUE, -- matrícula ou e-mail institucional
  SenhaHash NVARCHAR(100) NOT NULL
);
CREATE TABLE Salas (
  Id INT IDENTITY PRIMARY KEY,
  Codigo NVARCHAR(10) NOT NULL,
  Bloco NVARCHAR(5) NOT NULL,
  Andar INT NOT NULL,
  Campus NVARCHAR(50) NOT NULL,
  Capacidade INT NOT NULL,
  Recursos NVARCHAR(200),
  Descricao NVARCHAR(300),
  Imagem NVARCHAR(50)
);
CREATE TABLE Reservas (
  Id INT IDENTITY PRIMARY KEY,
  Codigo NVARCHAR(20) NOT NULL UNIQUE,
  UsuarioId INT NOT NULL REFERENCES Usuarios(Id),
  SalaId INT NOT NULL REFERENCES Salas(Id),
  Data DATE NOT NULL,
  HoraInicio TINYINT NOT NULL, -- 10, 12, 14 ou 16 (períodos de 2h)
  Pessoas INT NOT NULL,
  Finalidade NVARCHAR(150),
  Status NVARCHAR(20) NOT NULL DEFAULT 'Confirmada'
);
INSERT INTO Salas (Codigo,Bloco,Andar,Campus,Capacidade,Recursos,Descricao,Imagem) VALUES
('C217','C',2,'Campus Principal',20,'Wi-Fi • Quadro branco • Projetor','Ambiente iluminado e confortável para trabalhos em equipe, com mesa compartilhada e isolamento acústico.','C217.jpg'),
('A105','A',1,'Campus Principal',15,'Wi-Fi • Quadro branco','Sala aconchegante para revisão de conteúdos e troca de ideias.','A105.jpg'),
('C316','C',3,'Campus Principal',12,'Wi-Fi • Projetor • Quadro Branco • Computadores','Sala equipada com computadores para trabalhos práticos.','C316.jpg');

INSERT INTO Salas (Codigo,Bloco,Andar,Campus,Capacidade,Recursos,Descricao,Imagem) VALUES
('B201','B',2,'Campus Principal',25,'Wi-Fi • Quadro branco • Projetor','Sala ampla e bem ventilada, ideal para apresentações e reuniões.','B201.jpg'),
('C325','C',3,'Campus Principal',50,'Wi-Fi • Quadro branco • Projetor • Computadores','Sala ampla, perfeita para estudos em grupo.','C325.jpg'),
('E305','E',3,'Campus Principal',30,'Wi-Fi • Projetor • Quadro Branco','Sala grande com recursos audiovisuais, adequada para palestras e workshops.','E305.jpg');