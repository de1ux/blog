release:
	rm -rf public
	hugo
	cd public
	aws s3 sync . s3://de1ux.com/

.PHONY: build