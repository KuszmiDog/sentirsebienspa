import { useCallback, useEffect, useState } from "react";
import AnimationManager from "../AnimationManager";
import { Orientation } from "../types";
import useGetTransitionValue from "./useGetTransitionValue";
import useReducedMotion from "./useReduceMotion";

interface UseParallaxTransformProps {
	scale: number;
	overflow: boolean;
	delay: number;
	transition: string;
	orientation: Orientation;
	maxTransition: number | null;
	isVisible: boolean;
	isLoaded: boolean;
	imageHeight: number;
	imageRef: React.RefObject<HTMLImageElement>;
}

export const useParallaxTransform = ({
	scale,
	overflow,
	delay,
	transition,
	orientation,
	maxTransition,
	isVisible,
	isLoaded,
	imageHeight,
	imageRef,
}: UseParallaxTransformProps) => {
	const [isInit, setIsInit] = useState(false);
	const [viewportTop, setViewportTop] = useState(0);
	const [boundingClientRect, setBoundingClientRect] = useState<DOMRect | null>(
		null
	);
	const [shouldApplyTransition, setShouldApplyTransition] = useState(false);

	const prefersReducedMotion = useReducedMotion();

	// Use the existing hook for calculating transition values
	const transitionValue = useGetTransitionValue({
		isLoaded,
		imageHeight,
		scale,
		boundingClientRect: boundingClientRect as DOMRect,
		orientation,
		maxTransition,
	});

	// Direct DOM manipulation for transforms
	const applyTransform = useCallback(
		(transformValue: string) => {
			if (!imageRef.current || prefersReducedMotion || !transformValue) return;

			let transform = `translate3d(${transformValue})`;
			if (!overflow) {
				transform += ` scale(${scale})`;
			}

			imageRef.current.style.transform = transform;
		},
		[imageRef, scale, overflow, prefersReducedMotion]
	);

	// Simplified transition management (React's useEffect handles the caching)
	const manageTransition = useCallback(
		(shouldApply: boolean) => {
			if (!imageRef.current || prefersReducedMotion) return;

			const transitionValue =
				shouldApply && delay > 0 ? `transform ${delay}s ${transition}` : "";

			imageRef.current.style.transition = transitionValue;
		},
		[imageRef, delay, transition, prefersReducedMotion]
	);

	// Optimized parallax update function
	const updateParallax = useCallback(() => {
		if ((!isVisible && isInit) || prefersReducedMotion) {
			return;
		}

		if (window.scrollY !== viewportTop || !isInit) {
			const newBoundingClientRect = imageRef.current?.getBoundingClientRect();
			if (newBoundingClientRect) {
				setBoundingClientRect(newBoundingClientRect);
			}
			if (!isInit) {
				// Enable transitions after first calculation
				setTimeout(() => {
					setShouldApplyTransition(true);
				}, 50);
			}
			setViewportTop(window.scrollY);
		}
	}, [viewportTop, isVisible, imageRef, isInit, prefersReducedMotion]);

	// Apply transform when transitionValue changes
	useEffect(() => {
		if (transitionValue && (isVisible || !isInit)) {
			applyTransform(transitionValue);
			setIsInit(true);
		}
	}, [transitionValue, isVisible, isInit, applyTransform]);

	// Handle initial scale for non-overflow mode
	useEffect(() => {
		if (!overflow && isLoaded && imageRef.current && !prefersReducedMotion) {
			imageRef.current.style.transform = `scale(${scale})`;
		}
	}, [scale, overflow, isLoaded, prefersReducedMotion]);

	// Manage transitions
	useEffect(() => {
		manageTransition(shouldApplyTransition);
	}, [shouldApplyTransition, manageTransition]);

	// Setup animation manager
	useEffect(() => {
		if (!prefersReducedMotion) {
			AnimationManager.register(updateParallax);
		}

		return () => {
			AnimationManager.unregister(updateParallax);
		};
	}, [updateParallax, prefersReducedMotion]);

	// Cleanup on reduced motion
	useEffect(() => {
		if (prefersReducedMotion && imageRef.current) {
			imageRef.current.style.transform = "";
			imageRef.current.style.transition = "";
		}
	}, [prefersReducedMotion]);
};
