import Video from './main.js';
import mockData from './example.data.json';
import vimeoData from './example.vimeo.data.json';
import customData from './example.custom.data.json';

describe('Video', () => {
    it('renders the default example data', async () => {
        const result = await Video.main(mockData);

        expect(result).toContain('class="video  not-ready');
        expect(result).toContain('col-12');
        expect(result).toContain('ratio-16x9');
        expect(result).toContain('https://www.youtube.com/embed/8tuQnRijZ58');
        expect(result).toContain('--thumbnail:url(https://picsum.photos/536/354)');
        expect(result).toContain('3:12');
        expect(result).toContain('Show transcript');
        expect(result).toContain('Transcript of the video.');
    });

    it('renders Vimeo and custom iframes', async () => {
        expect(await Video.main(vimeoData)).toContain('https://player.vimeo.com/video/251763826');
        expect(await Video.main(customData)).toContain('video-custom');
    });

    it('shows a message and empty thumbnail class when no video or image is given', async () => {
        const result = await Video.main({});

        expect(result).toContain('A video has not been provided.');
        expect(result).toContain('empty-thumbnail');
    });

    it('omits the watch nav and not-ready state when autoplay is on', async () => {
        const result = await Video.main({...mockData, additionalSettings: {autoPlay: true}});

        expect(result).not.toContain('video-nav');
        expect(result).not.toContain('not-ready');
    });

    it('escapes XSS in description, ids and wrapper classes', async () => {
        const result = await Video.main({
            ...mockData,
            videoId: '"><script>x</script>',
            description: '<script>d</script>',
            wrapperClasses: '" onclick="x',
            duration: '<script>t</script>',
        });

        expect(result).not.toContain('<script>');
        expect(result).not.toContain('" onclick="');
    });
});
