-- Que memória? — temas de emoji (os que vinham no código)
-- Rode DEPOIS do schema.sql. Pode rodar de novo: atualiza sem duplicar.

insert into public.que_memoria_themes (id, name, kind, cover_emoji, color, sort_order)
values ('bichos', 'Bichos', 'emoji', '🐶', '#fff3cb', 10)
on conflict (id) do update set name = excluded.name, kind = excluded.kind,
  cover_emoji = excluded.cover_emoji, color = excluded.color, sort_order = excluded.sort_order;

insert into public.que_memoria_theme_items (theme_id, slug, name, emoji, sort_order) values
  ('bichos', 'cachorro', 'Cachorro', '🐶', 0),
  ('bichos', 'gato', 'Gato', '🐱', 1),
  ('bichos', 'rato', 'Rato', '🐭', 2),
  ('bichos', 'hamster', 'Hamster', '🐹', 3),
  ('bichos', 'coelho', 'Coelho', '🐰', 4),
  ('bichos', 'raposa', 'Raposa', '🦊', 5),
  ('bichos', 'urso', 'Urso', '🐻', 6),
  ('bichos', 'panda', 'Panda', '🐼', 7),
  ('bichos', 'coala', 'Coala', '🐨', 8),
  ('bichos', 'tigre', 'Tigre', '🐯', 9),
  ('bichos', 'leao', 'Leão', '🦁', 10),
  ('bichos', 'vaca', 'Vaca', '🐮', 11),
  ('bichos', 'porco', 'Porco', '🐷', 12),
  ('bichos', 'sapo', 'Sapo', '🐸', 13),
  ('bichos', 'macaco', 'Macaco', '🐵', 14),
  ('bichos', 'galinha', 'Galinha', '🐔', 15),
  ('bichos', 'pinguim', 'Pinguim', '🐧', 16),
  ('bichos', 'coruja', 'Coruja', '🦉', 17)
on conflict (theme_id, slug) do update set name = excluded.name, emoji = excluded.emoji,
  sort_order = excluded.sort_order;

insert into public.que_memoria_themes (id, name, kind, cover_emoji, color, sort_order)
values ('frutas', 'Frutas', 'emoji', '🍓', '#fde1e8', 20)
on conflict (id) do update set name = excluded.name, kind = excluded.kind,
  cover_emoji = excluded.cover_emoji, color = excluded.color, sort_order = excluded.sort_order;

insert into public.que_memoria_theme_items (theme_id, slug, name, emoji, sort_order) values
  ('frutas', 'maca', 'Maçã', '🍎', 0),
  ('frutas', 'maca-verde', 'Maçã verde', '🍏', 1),
  ('frutas', 'pera', 'Pera', '🍐', 2),
  ('frutas', 'laranja', 'Laranja', '🍊', 3),
  ('frutas', 'limao', 'Limão', '🍋', 4),
  ('frutas', 'banana', 'Banana', '🍌', 5),
  ('frutas', 'melancia', 'Melancia', '🍉', 6),
  ('frutas', 'uva', 'Uva', '🍇', 7),
  ('frutas', 'morango', 'Morango', '🍓', 8),
  ('frutas', 'melao', 'Melão', '🍈', 9),
  ('frutas', 'cereja', 'Cereja', '🍒', 10),
  ('frutas', 'pessego', 'Pêssego', '🍑', 11),
  ('frutas', 'manga', 'Manga', '🥭', 12),
  ('frutas', 'abacaxi', 'Abacaxi', '🍍', 13),
  ('frutas', 'coco', 'Coco', '🥥', 14),
  ('frutas', 'kiwi', 'Kiwi', '🥝', 15),
  ('frutas', 'tomate', 'Tomate', '🍅', 16),
  ('frutas', 'abacate', 'Abacate', '🥑', 17)
on conflict (theme_id, slug) do update set name = excluded.name, emoji = excluded.emoji,
  sort_order = excluded.sort_order;

insert into public.que_memoria_themes (id, name, kind, cover_emoji, color, sort_order)
values ('comidas', 'Comidas', 'emoji', '🍕', '#ffe6cc', 30)
on conflict (id) do update set name = excluded.name, kind = excluded.kind,
  cover_emoji = excluded.cover_emoji, color = excluded.color, sort_order = excluded.sort_order;

insert into public.que_memoria_theme_items (theme_id, slug, name, emoji, sort_order) values
  ('comidas', 'pizza', 'Pizza', '🍕', 0),
  ('comidas', 'hamburguer', 'Hambúrguer', '🍔', 1),
  ('comidas', 'batata-frita', 'Batata frita', '🍟', 2),
  ('comidas', 'cachorro-quente', 'Cachorro-quente', '🌭', 3),
  ('comidas', 'sanduiche', 'Sanduíche', '🥪', 4),
  ('comidas', 'taco', 'Taco', '🌮', 5),
  ('comidas', 'burrito', 'Burrito', '🌯', 6),
  ('comidas', 'salada', 'Salada', '🥗', 7),
  ('comidas', 'macarrao', 'Macarrão', '🍝', 8),
  ('comidas', 'lamen', 'Lámen', '🍜', 9),
  ('comidas', 'sushi', 'Sushi', '🍣', 10),
  ('comidas', 'camarao', 'Camarão', '🍤', 11),
  ('comidas', 'rosquinha', 'Rosquinha', '🍩', 12),
  ('comidas', 'biscoito', 'Biscoito', '🍪', 13),
  ('comidas', 'bolo-de-aniversario', 'Bolo de aniversário', '🎂', 14),
  ('comidas', 'fatia-de-bolo', 'Fatia de bolo', '🍰', 15),
  ('comidas', 'chocolate', 'Chocolate', '🍫', 16),
  ('comidas', 'pipoca', 'Pipoca', '🍿', 17)
on conflict (theme_id, slug) do update set name = excluded.name, emoji = excluded.emoji,
  sort_order = excluded.sort_order;

insert into public.que_memoria_themes (id, name, kind, cover_emoji, color, sort_order)
values ('esportes', 'Esportes', 'emoji', '⚽', '#d6f3e8', 40)
on conflict (id) do update set name = excluded.name, kind = excluded.kind,
  cover_emoji = excluded.cover_emoji, color = excluded.color, sort_order = excluded.sort_order;

insert into public.que_memoria_theme_items (theme_id, slug, name, emoji, sort_order) values
  ('esportes', 'futebol', 'Futebol', '⚽', 0),
  ('esportes', 'basquete', 'Basquete', '🏀', 1),
  ('esportes', 'futebol-americano', 'Futebol americano', '🏈', 2),
  ('esportes', 'beisebol', 'Beisebol', '⚾', 3),
  ('esportes', 'tenis', 'Tênis', '🎾', 4),
  ('esportes', 'volei', 'Vôlei', '🏐', 5),
  ('esportes', 'rugbi', 'Rúgbi', '🏉', 6),
  ('esportes', 'sinuca', 'Sinuca', '🎱', 7),
  ('esportes', 'pingue-pongue', 'Pingue-pongue', '🏓', 8),
  ('esportes', 'badminton', 'Badminton', '🏸', 9),
  ('esportes', 'hoquei', 'Hóquei', '🏒', 10),
  ('esportes', 'boxe', 'Boxe', '🥊', 11),
  ('esportes', 'skate', 'Skate', '🛹', 12),
  ('esportes', 'golfe', 'Golfe', '⛳', 13),
  ('esportes', 'arco-e-flecha', 'Arco e flecha', '🏹', 14),
  ('esportes', 'judo', 'Judô', '🥋', 15),
  ('esportes', 'boliche', 'Boliche', '🎳', 16),
  ('esportes', 'trofeu', 'Troféu', '🏆', 17)
on conflict (theme_id, slug) do update set name = excluded.name, emoji = excluded.emoji,
  sort_order = excluded.sort_order;

insert into public.que_memoria_themes (id, name, kind, cover_emoji, color, sort_order)
values ('natureza', 'Natureza', 'emoji', '🌻', '#e3f4d7', 50)
on conflict (id) do update set name = excluded.name, kind = excluded.kind,
  cover_emoji = excluded.cover_emoji, color = excluded.color, sort_order = excluded.sort_order;

insert into public.que_memoria_theme_items (theme_id, slug, name, emoji, sort_order) values
  ('natureza', 'girassol', 'Girassol', '🌻', 0),
  ('natureza', 'tulipa', 'Tulipa', '🌷', 1),
  ('natureza', 'rosa', 'Rosa', '🌹', 2),
  ('natureza', 'cacto', 'Cacto', '🌵', 3),
  ('natureza', 'palmeira', 'Palmeira', '🌴', 4),
  ('natureza', 'trevo', 'Trevo', '🍀', 5),
  ('natureza', 'folha-de-bordo', 'Folha de bordo', '🍁', 6),
  ('natureza', 'cogumelo', 'Cogumelo', '🍄', 7),
  ('natureza', 'arco-iris', 'Arco-íris', '🌈', 8),
  ('natureza', 'estrela', 'Estrela', '⭐', 9),
  ('natureza', 'lua', 'Lua', '🌙', 10),
  ('natureza', 'sol', 'Sol', '🌞', 11),
  ('natureza', 'onda', 'Onda', '🌊', 12),
  ('natureza', 'fogo', 'Fogo', '🔥', 13),
  ('natureza', 'flor-de-cerejeira', 'Flor de cerejeira', '🌸', 14),
  ('natureza', 'pinheiro', 'Pinheiro', '🌲', 15),
  ('natureza', 'concha', 'Concha', '🐚', 16),
  ('natureza', 'vulcao', 'Vulcão', '🌋', 17)
on conflict (theme_id, slug) do update set name = excluded.name, emoji = excluded.emoji,
  sort_order = excluded.sort_order;

insert into public.que_memoria_themes (id, name, kind, cover_emoji, color, sort_order)
values ('viagem', 'Viagem', 'emoji', '🚀', '#dde7fb', 60)
on conflict (id) do update set name = excluded.name, kind = excluded.kind,
  cover_emoji = excluded.cover_emoji, color = excluded.color, sort_order = excluded.sort_order;

insert into public.que_memoria_theme_items (theme_id, slug, name, emoji, sort_order) values
  ('viagem', 'carro', 'Carro', '🚗', 0),
  ('viagem', 'taxi', 'Táxi', '🚕', 1),
  ('viagem', 'utilitario', 'Utilitário', '🚙', 2),
  ('viagem', 'onibus', 'Ônibus', '🚌', 3),
  ('viagem', 'trolebus', 'Trólebus', '🚎', 4),
  ('viagem', 'viatura', 'Viatura', '🚓', 5),
  ('viagem', 'ambulancia', 'Ambulância', '🚑', 6),
  ('viagem', 'bombeiros', 'Bombeiros', '🚒', 7),
  ('viagem', 'van', 'Van', '🚐', 8),
  ('viagem', 'caminhao', 'Caminhão', '🚚', 9),
  ('viagem', 'carreta', 'Carreta', '🚛', 10),
  ('viagem', 'trator', 'Trator', '🚜', 11),
  ('viagem', 'bicicleta', 'Bicicleta', '🚲', 12),
  ('viagem', 'moto', 'Moto', '🛵', 13),
  ('viagem', 'trem', 'Trem', '🚂', 14),
  ('viagem', 'foguete', 'Foguete', '🚀', 15),
  ('viagem', 'helicoptero', 'Helicóptero', '🚁', 16),
  ('viagem', 'veleiro', 'Veleiro', '⛵', 17)
on conflict (theme_id, slug) do update set name = excluded.name, emoji = excluded.emoji,
  sort_order = excluded.sort_order;
