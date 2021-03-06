var watchlistParser = require('../../../src/page_parser').watchlist;
var cheerio = require('cheerio');
var fs = require('fs');

describe('watchlist parser', function() {
    describe('colume parsers', function() {
        it('should parse the airing column', function() {
            var $ = cheerio.load(fs.readFileSync('test/fixtures/page_parser/watchlist_airing.html'));
            watchlistParser.parseAiringColumn($('#first')).should.be.true;
            watchlistParser.parseAiringColumn($('#second')).should.not.be.true;
        });

        it('should parse the name and id', function() {
            var $ = cheerio.load(fs.readFileSync('test/fixtures/page_parser/watchlist_nameid.html'));
            watchlistParser.parseNameColumn($('#first')).should.eql({
                name: 'Gangsta.',
                id: 11539,
                url: '/watch/11539/11/engsub#top'
            });

            watchlistParser.parseNameColumn($('#second')).should.eql({
                name: 'Chu Feng: BEE',
                id: 13493,
                url: '/watch/13493/3/gersub#top'
            });
        });

        it('should parse episode', function() {
            var $ = cheerio.load('<td id="first">11</td><td id="second">3</td><td id="third">01</td>');
            watchlistParser.parseEpisodeColumn($('#first')).should.eql(11);
            watchlistParser.parseEpisodeColumn($('#second')).should.eql(3);
            watchlistParser.parseEpisodeColumn($('#third')).should.eql(1);
        });

        it('should parse sub', function() {
            var $ = cheerio.load('<td id="first">EngSub</td><td id="second">GerSub</td><td id="third">GerDub</td>');
            watchlistParser.parseSubColumn($('#first')).should.eql('engsub');
            watchlistParser.parseSubColumn($('#second')).should.eql('gersub');
            watchlistParser.parseSubColumn($('#third')).should.eql('gerdub');
        });

        it('should parse online status', function() {
            var $ = cheerio.load('<td id="first"><img src="/images/misc/onlineicon.png"></td><td id="second"><img src="/images/misc/offlineicon.png"></td>');
            watchlistParser.parseStatusColumn($('#first')).should.be.true;
            watchlistParser.parseStatusColumn($('#second')).should.not.be.true;
        });
    });

    it('should parse rows', function() {
        var $ = cheerio.load(fs.readFileSync('test/fixtures/page_parser/watchlist_rows.html'));
        var result = watchlistParser.parseRow($('#entry1'));
        result.should.have.property('name', 'Gangsta.');
        result.should.have.property('episode', 11);
        result.should.have.property('status', true);
        result.should.have.property('id', 11539);
        result.should.have.property('airing', true);
        result.should.have.property('sub', 'engsub');
        result.should.have.property('url', '/watch/11539/11/engsub#top');
        result.should.have.property('entry', 1);

        result = watchlistParser.parseRow($('#entry2'));
        result.should.have.property('name', 'Muv-Luv Alternative: Total Eclipse');
        result.should.have.property('episode', 23);
        result.should.have.property('status', true);
        result.should.have.property('airing', false);
        result.should.have.property('id', 4169);
        result.should.have.property('sub', 'gersub');
        result.should.have.property('url', '/watch/4169/23/gersub#top');
        result.should.have.property('entry', 2);
    });

    it('should parse a table', function() {
        var $ = cheerio.load(fs.readFileSync('test/fixtures/page_parser/watchlist_table.html'));
        var result = watchlistParser.extractFromTable($, $('#first'));
        result.type.should.be.eql('anime');
        result.contents.length.should.eql(3);
        result.contents[0].should.have.property('name', 'Gangsta.');
        result.contents[0].should.have.property('entry', 18933051);
        result.contents[1].should.have.property('name', 'To Love-Ru -Trouble- Darkness 2nd');
        result.contents[1].should.have.property('entry', 18919669);
        result.contents[2].should.have.property('name', 'Charlotte');
        result.contents[2].should.have.property('entry', 18868712);
    });

    it('parses the watchlist page', function() {
        var result = watchlistParser.parseWatchlist(fs.readFileSync('test/fixtures/page_parser/watchlist_page.html'));
        return result.should.eventually.be.eql({
            anime: [
                {
                    name: 'Gangsta.',
                    airing: true,
                    status: true,
                    episode: 11,
                    sub: 'engsub',
                    id: 11539,
                    entry: 18933051,
                    url: '/watch/11539/11/engsub#top'
                }
            ],
            manga: [
                {
                    name: 'Gakusen Toshi Asterisk',
                    episode: 17,
                    sub: 'englisch',
                    status: false,
                    airing: true,
                    id: 6304,
                    entry: 18780788,
                    url: '/chapter/6304/17/en#top'
                }
            ]
        });
    });

    it('parses an empty watchlist page #100', function() {
        var $ = cheerio.load(fs.readFileSync('test/fixtures/page_parser/watchlist_empty.html'));
        return watchlistParser.parseWatchlist($('#allClear').html()).should.eventually.be.eql({
            anime: [],
            manga: []
        });
    });

    it('parses a watchlist that has only animes #100', function() {
        var $ = cheerio.load(fs.readFileSync('test/fixtures/page_parser/watchlist_empty.html'));
        return watchlistParser.parseWatchlist($('#mangaClear').html()).should.eventually.be.eql({
            anime: [
                {
                    name: 'Re:Zero kara Hajimeru Isekai Seikatsu',
                    episode: 1,
                    sub: 'engsub',
                    status: true,
                    airing: true,
                    id: 13975,
                    entry: 33502664,
                    url: '/watch/13975/1/engsub#top'
                }
            ],
            manga: []
        });
    });

    it('parses a watchlist that has only mangas #100', function() {
        var $ = cheerio.load(fs.readFileSync('test/fixtures/page_parser/watchlist_empty.html'));
        return watchlistParser.parseWatchlist($('#animeClear').html()).should.eventually.be.eql({
            anime: [],
            manga: [
                {
                    name: 'The Gamer',
                    episode: 1,
                    sub: 'englisch',
                    status: true,
                    airing: true,
                    id: 7578,
                    entry: 33502802,
                    url: '/chapter/7578/1/en#top'
                }
            ]
        });
    });
});
